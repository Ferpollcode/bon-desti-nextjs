"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type IngresoState = { error?: string; success?: boolean } | null;

export async function registrarIngreso(
  _prev: IngresoState,
  formData: FormData,
): Promise<IngresoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const tipo = formData.get("tipo") as string;
  const patente = (formData.get("patente") as string)?.trim() || null;
  const notas   = (formData.get("notas")   as string)?.trim() || null;

  let residente_id: string | null = null;
  let visitante_id: string | null = null;
  let lote_id: string | null = (formData.get("lote_id") as string) || null;

  if (tipo === "residente") {
    residente_id = (formData.get("residente_id") as string) || null;
    if (!residente_id) return { error: "Seleccioná un residente" };

    if (!lote_id) {
      const { data: r } = await supabase
        .from("residentes")
        .select("lote_id")
        .eq("id", residente_id)
        .single();
      lote_id = r?.lote_id ?? null;
    }
  } else {
    const nombre   = (formData.get("nombre")   as string)?.trim();
    const apellido = (formData.get("apellido") as string)?.trim();
    const documento = (formData.get("documento") as string)?.trim() || null;
    if (!nombre || !apellido) return { error: "Nombre y apellido son requeridos" };

    const { data: v, error: vErr } = await supabase
      .from("visitantes")
      .insert({ nombre, apellido, documento, patente, lote_id })
      .select("id")
      .single();
    if (vErr) return { error: "Error al crear visitante: " + vErr.message };
    visitante_id = v.id;
  }

  const { error } = await supabase.from("ingresos").insert({
    tipo,
    residente_id,
    visitante_id,
    lote_id,
    patente,
    notas,
    registrado_por: user.id,
  });

  if (error) return { error: "Error al registrar: " + error.message };

  revalidatePath("/seguridad");
  return { success: true };
}

export async function registrarEgreso(id: string) {
  const supabase = await createClient();
  await supabase
    .from("ingresos")
    .update({ egresado_at: new Date().toISOString() })
    .eq("id", id)
    .is("egresado_at", null);
  revalidatePath("/seguridad");
}
