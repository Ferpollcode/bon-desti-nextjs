"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ResidenteState = { error?: string; success?: boolean } | null;

async function canManageResidentes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user) && user?.app_metadata?.rol !== "seguridad";
}

export async function saveResidente(
  id: string | null,
  _prev: ResidenteState,
  formData: FormData,
): Promise<ResidenteState> {
  if (!(await canManageResidentes())) {
    return { error: "Seguridad no puede editar residentes" };
  }

  const supabase = await createClient();
  const nombre = (formData.get("nombre") as string)?.trim();
  const apellido = (formData.get("apellido") as string)?.trim();
  const dni = (formData.get("dni") as string)?.trim() || null;
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const lote_id = (formData.get("lote_id") as string) || null;
  const tipo = (formData.get("tipo") as string) || "propietario";

  if (!nombre || !apellido) return { error: "Nombre y apellido son requeridos" };

  if (id) {
    const { error } = await supabase
      .from("residentes")
      .update({ nombre, apellido, dni, telefono, email, lote_id, tipo })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("residentes")
      .insert({ nombre, apellido, dni, telefono, email, lote_id, tipo, activo: true });
    if (error) return { error: error.message };
  }

  revalidatePath("/residentes");
  return { success: true };
}

export async function toggleActivoResidente(id: string, activo: boolean, _formData: FormData) {
  if (!(await canManageResidentes())) {
    throw new Error("Seguridad no puede editar residentes");
  }

  const supabase = await createClient();
  await supabase.from("residentes").update({ activo: !activo }).eq("id", id);
  revalidatePath("/residentes");
}

export async function deleteResidente(id: string, profileId: string | null, _formData: FormData) {
  if (!(await canManageResidentes())) {
    throw new Error("Seguridad no puede borrar residentes");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("residentes").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  if (profileId) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(profileId);
  }

  revalidatePath("/residentes");
}
