"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PortalState = { error?: string; success?: boolean } | null;
export type TokenUnicoState =
  | {
      error?: string;
      success?: boolean;
      token?: string;
      vence_at?: string | null;
    }
  | null;

export async function enviarEmergencia(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const lote_id = (formData.get("lote_id") as string) || null;
  const descripcion =
    (formData.get("descripcion") as string)?.trim() ||
    "Emergencia reportada desde el portal";

  const { error } = await supabase.from("emergencias").insert({
    descripcion,
    lote_id,
    estado: "activa",
    reportado_por: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/portal");
  return { success: true };
}

export async function generarTokenUnicoVisita(
  _prev: TokenUnicoState,
  formData: FormData,
): Promise<TokenUnicoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const residente_id = (formData.get("residente_id") as string) || null;
  const visitante = (formData.get("visitante") as string)?.trim();
  const documento = (formData.get("documento") as string)?.trim() || null;
  const vence_at = (formData.get("vence_at") as string) || null;

  if (!residente_id) return { error: "Seleccioná tu casa antes de generar el token" };
  if (!visitante) return { error: "El nombre del visitante es requerido" };

  const { data: residente } = await supabase
    .from("residentes")
    .select("id")
    .eq("id", residente_id)
    .eq("profile_id", user.id)
    .eq("activo", true)
    .single();

  if (!residente) return { error: "No tenés permiso para generar pases en esa casa" };

  const descripcion = documento
    ? `Visita: ${visitante} - DNI ${documento}`
    : `Visita: ${visitante}`;

  const { data, error } = await supabase
    .from("pases_qr")
    .insert({
      residente_id,
      tipo: "unico_uso",
      descripcion,
      vence_at,
      activo: true,
    })
    .select("token, vence_at")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal");
  return {
    success: true,
    token: data?.token,
    vence_at: data?.vence_at ?? null,
  };
}
