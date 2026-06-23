"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type VisitanteState = { error?: string; success?: boolean } | null;

export async function saveVisitante(
  id: string,
  _prev: VisitanteState,
  formData: FormData,
): Promise<VisitanteState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const apellido = (formData.get("apellido") as string)?.trim();
  const documento = (formData.get("documento") as string)?.trim() || null;
  const patente = (formData.get("patente") as string)?.trim() || null;
  const lote_id = (formData.get("lote_id") as string) || null;
  const observaciones = (formData.get("observaciones") as string)?.trim() || null;

  if (!nombre || !apellido) {
    return { error: "Nombre y apellido son requeridos" };
  }

  const { error } = await supabase
    .from("visitantes")
    .update({ nombre, apellido, documento, patente, lote_id, observaciones })
    .eq("id", id);

  if (error) return { error: "Error al guardar: " + error.message };

  revalidatePath("/visitantes");
  revalidatePath("/seguridad");
  return { success: true };
}

export async function eliminarVisitante(id: string, _formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("visitantes").delete().eq("id", id);

  revalidatePath("/visitantes");
  revalidatePath("/seguridad");
}
