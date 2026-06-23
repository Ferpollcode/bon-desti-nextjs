"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { endOfLocalDayIso } from "@/lib/timezone";

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
  const visitante =
    (formData.get("visitante_nombre") as string)?.trim() ||
    (formData.get("visitante") as string)?.trim();
  const documento =
    (formData.get("visitante_documento") as string)?.trim() ||
    (formData.get("documento") as string)?.trim() ||
    null;
  const visitante_telefono = (formData.get("visitante_telefono") as string)?.trim() || null;
  const motivo = (formData.get("motivo") as string)?.trim() || null;
  const valido_desde = (formData.get("valido_desde") as string) || null;
  const vence_at = (formData.get("vence_at") as string) || null;
  const hora_desde = (formData.get("hora_desde") as string) || null;
  const hora_hasta = (formData.get("hora_hasta") as string) || null;
  const dias = formData.getAll("dias_habilitados") as string[];
  const venceHastaFinDelDia = vence_at ? endOfLocalDayIso(vence_at) : null;

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

  // Generar token de 6 dígitos único entre pases activos
  let token: string | null = null;
  for (let i = 0; i < 3; i++) {
    const candidato = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    const { count } = await supabase
      .from("pases_qr")
      .select("*", { count: "exact", head: true })
      .eq("token", candidato)
      .eq("activo", true);
    if ((count ?? 1) === 0) { token = candidato; break; }
  }
  if (!token) return { error: "No se pudo generar un token único, intentá de nuevo" };

  const descripcion = documento
    ? `Visita: ${visitante} - DNI ${documento}`
    : `Visita: ${visitante}`;

  const { data, error } = await supabase
    .from("pases_qr")
    .insert({
      residente_id,
      tipo: "unico_uso",
      descripcion,
      token,
      visitante_nombre: visitante,
      visitante_documento: documento,
      visitante_telefono,
      motivo,
      valido_desde: valido_desde || null,
      vence_at: venceHastaFinDelDia,
      hora_desde: hora_desde || null,
      hora_hasta: hora_hasta || null,
      dias_habilitados: dias,
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

export type PaseTemporalState = {
  error?: string;
  success?: boolean;
  token?: string;
} | null;

export async function generarPaseTemporal(
  _prev: PaseTemporalState,
  formData: FormData,
): Promise<PaseTemporalState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const residente_id = formData.get("residente_id") as string;
  if (!residente_id) return { error: "Seleccioná tu casa primero" };

  const { data: residente } = await supabase
    .from("residentes")
    .select("id")
    .eq("id", residente_id)
    .eq("profile_id", user.id)
    .eq("activo", true)
    .single();
  if (!residente) return { error: "No tenés permiso para generar pases en esa casa" };

  const visitante_nombre = (formData.get("visitante_nombre") as string)?.trim();
  if (!visitante_nombre) return { error: "El nombre del visitante es requerido" };

  const visitante_documento = (formData.get("visitante_documento") as string)?.trim() || null;
  const visitante_telefono = (formData.get("visitante_telefono") as string)?.trim() || null;
  const motivo = (formData.get("motivo") as string)?.trim() || null;
  const valido_desde = (formData.get("valido_desde") as string) || null;
  const vence_hasta = (formData.get("vence_at") as string) || null;
  const hora_desde = (formData.get("hora_desde") as string) || null;
  const hora_hasta = (formData.get("hora_hasta") as string) || null;
  const dias = formData.getAll("dias_habilitados") as string[];

  const { data, error } = await supabase
    .from("pases_qr")
    .insert({
      residente_id,
      tipo: "temporal",
      descripcion: `Visita: ${visitante_nombre}`,
      visitante_nombre,
      visitante_documento,
      visitante_telefono,
      motivo,
      valido_desde: valido_desde || null,
      vence_at: vence_hasta ? endOfLocalDayIso(vence_hasta) : null,
      hora_desde: hora_desde || null,
      hora_hasta: hora_hasta || null,
      dias_habilitados: dias,
      activo: true,
    })
    .select("token")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal");
  return { success: true, token: data?.token };
}

export async function desactivarPase(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id") as string;

  // Verificar ownership sin join (evita bloqueo por RLS en la tabla residentes)
  const { data: residentes } = await supabase
    .from("residentes")
    .select("id")
    .eq("profile_id", user.id);

  if (!residentes?.length) return;
  const residenteIds = residentes.map((r) => r.id);

  await supabase
    .from("pases_qr")
    .update({ activo: false })
    .eq("id", id)
    .in("residente_id", residenteIds);

  revalidatePath("/portal");
}

export type ReclamoState = { error?: string; success?: boolean } | null;

export async function enviarReclamo(
  _prev: ReclamoState,
  formData: FormData,
): Promise<ReclamoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const residente_id = formData.get("residente_id") as string;
  if (!residente_id) return { error: "Seleccioná tu casa primero" };

  const { data: residente } = await supabase
    .from("residentes")
    .select("id")
    .eq("id", residente_id)
    .eq("profile_id", user.id)
    .eq("activo", true)
    .single();
  if (!residente) return { error: "No tenés permiso para enviar reclamos desde esa casa" };

  const destinatario = formData.get("destinatario") as string;
  const tipo = formData.get("tipo") as string;
  const asunto = (formData.get("asunto") as string)?.trim();
  const mensaje = (formData.get("mensaje") as string)?.trim();

  if (!asunto) return { error: "El asunto es requerido" };
  if (!mensaje) return { error: "El mensaje es requerido" };

  const { error } = await supabase.from("reclamos").insert({
    residente_id,
    destinatario,
    tipo,
    asunto,
    mensaje,
  });

  if (error) return { error: error.message };

  revalidatePath("/portal");
  return { success: true };
}
