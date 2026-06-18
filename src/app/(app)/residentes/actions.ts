"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResidenteState = { error?: string; success?: boolean } | null;

export async function saveResidente(
  id: string | null,
  _prev: ResidenteState,
  formData: FormData,
): Promise<ResidenteState> {
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
  const supabase = await createClient();
  await supabase.from("residentes").update({ activo: !activo }).eq("id", id);
  revalidatePath("/residentes");
}
