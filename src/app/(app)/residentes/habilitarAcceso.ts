"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AccesoState = { error?: string; success?: boolean; usuario?: string } | null;

async function canManageResidentAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user) && user?.app_metadata?.rol !== "seguridad";
}

export async function habilitarAccesoPortal(
  residenteId: string,
  _prev: AccesoState,
  formData: FormData,
): Promise<AccesoState> {
  if (!(await canManageResidentAccess())) {
    return { error: "Seguridad no puede modificar accesos de residentes" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuario = (formData.get("usuario") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!usuario) return { error: "El nombre de usuario es requerido" };
  if (!password || password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres" };

  const email = `${usuario}@bondesti.local`;
  const admin = createAdminClient();

  // Verificar que no exista ya ese email
  const { data: existing } = await admin.auth.admin.listUsers();
  if (existing?.users.some((u) => u.email === email)) {
    return { error: `El usuario "${usuario}" ya existe` };
  }

  // Crear usuario en auth
  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { rol: "residente" },
  });
  if (createErr || !newUser.user) {
    return { error: createErr?.message ?? "Error al crear usuario" };
  }

  const uid = newUser.user.id;

  // Actualizar profile con rol residente
  await admin
    .from("profiles")
    .update({ rol: "residente" })
    .eq("id", uid);

  // Vincular residente → profile
  const { error: linkErr } = await supabase
    .from("residentes")
    .update({ profile_id: uid })
    .eq("id", residenteId);

  if (linkErr) {
    // Rollback: eliminar usuario recién creado
    await admin.auth.admin.deleteUser(uid);
    return { error: "Error al vincular residente: " + linkErr.message };
  }

  revalidatePath("/residentes");
  return { success: true, usuario };
}

export async function revocarAccesoPortal(residenteId: string, profileId: string, _formData: FormData) {
  if (!(await canManageResidentAccess())) {
    throw new Error("Seguridad no puede modificar accesos de residentes");
  }

  const admin = createAdminClient();

  // Desvincular primero
  const supabase = await createClient();
  await supabase.from("residentes").update({ profile_id: null }).eq("id", residenteId);

  // Eliminar usuario auth
  await admin.auth.admin.deleteUser(profileId);

  revalidatePath("/residentes");
}
