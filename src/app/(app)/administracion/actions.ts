"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal/auth";
import { createClient } from "@/lib/supabase/server";

export type ComunicacionState = { error?: string; success?: boolean } | null;

export async function enviarComunicacion(
  _prev: ComunicacionState,
  formData: FormData,
): Promise<ComunicacionState> {
  const { user } = await requireRole("admin");
  const supabase = await createClient();

  const titulo = (formData.get("titulo") as string)?.trim();
  const mensaje = (formData.get("mensaje") as string)?.trim();
  const destinatario = (formData.get("destinatario") as string) || "todos";

  if (!titulo) return { error: "El título es requerido" };
  if (!mensaje) return { error: "El mensaje es requerido" };

  let destinatario_tipo: "todos" | "residente" = "todos";
  let residente_id: string | null = null;

  if (destinatario !== "todos") {
    const { data: residente } = await supabase
      .from("residentes")
      .select("id")
      .eq("id", destinatario)
      .eq("activo", true)
      .single();

    if (!residente) return { error: "El residente seleccionado no existe" };
    destinatario_tipo = "residente";
    residente_id = residente.id;
  }

  const { error } = await supabase.from("comunicaciones").insert({
    titulo,
    mensaje,
    destinatario_tipo,
    residente_id,
    creado_por: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/administracion");
  revalidatePath("/portal");
  return { success: true };
}

export async function actualizarReclamo(
  id: string,
  _prev: null,
  formData: FormData,
): Promise<null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const estado = formData.get("estado") as string;
  const respuesta = (formData.get("respuesta") as string)?.trim() || null;

  await supabase
    .from("reclamos")
    .update({
      estado,
      respuesta,
      atendido_por: user.id,
      atendido_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/administracion");
  return null;
}
