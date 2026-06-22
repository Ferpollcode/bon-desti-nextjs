"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EmergenciaState = { error?: string; success?: boolean } | null;

export async function cambiarEstadoEmergencia(
  id: string,
  nuevoEstado: string,
  _formData: FormData,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const updates: Record<string, unknown> = { estado: nuevoEstado };
  if (nuevoEstado === "en_proceso") {
    updates.atendido_por = user.id;
  } else if (nuevoEstado === "resuelta") {
    updates.atendido_por = user.id;
    updates.resuelto_at = new Date().toISOString();
  }

  await supabase.from("emergencias").update(updates).eq("id", id);
  revalidatePath("/emergencias");
  revalidatePath("/");
}

export async function eliminarEmergencia(id: string, _formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("emergencias")
    .update({
      estado: "eliminada",
      atendido_por: user.id,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/emergencias");
  revalidatePath("/");
}

export async function crearEmergencia(
  _prev: EmergenciaState,
  formData: FormData,
): Promise<EmergenciaState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const descripcion = (formData.get("descripcion") as string)?.trim();
  const lote_id = (formData.get("lote_id") as string) || null;

  if (!descripcion) return { error: "La descripción es requerida" };

  const { error } = await supabase.from("emergencias").insert({
    descripcion,
    lote_id,
    estado: "activa",
    reportado_por: user.id,
  });

  if (error) return { error: "Error al registrar: " + error.message };

  revalidatePath("/emergencias");
  revalidatePath("/");
  return { success: true };
}
