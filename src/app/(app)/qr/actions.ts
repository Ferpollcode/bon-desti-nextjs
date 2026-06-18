"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Residente, Lote, PaseQR } from "@/lib/types/database";

export interface ValidacionQR {
  error?: string;
  pase?: PaseQR & { residente: (Residente & { lote: Lote | null }) | null };
  yaAdentro?: boolean;
}

export async function validarToken(token: string): Promise<ValidacionQR> {
  if (!token?.trim()) return { error: "Token vacío" };
  const supabase = await createClient();

  const { data: pase } = await supabase
    .from("pases_qr")
    .select("*, residente:residentes(*, lote:lotes(*))")
    .eq("token", token.trim())
    .single();

  if (!pase) return { error: "QR no encontrado o inválido" };
  if (!pase.activo) return { error: "Este QR está desactivado" };
  if (pase.vence_at && new Date(pase.vence_at) < new Date()) {
    return { error: "Este QR está vencido" };
  }

  // Verificar si el residente ya está adentro (sin egreso)
  if (pase.residente_id) {
    const { count } = await supabase
      .from("ingresos")
      .select("*", { count: "exact", head: true })
      .eq("residente_id", pase.residente_id)
      .is("egresado_at", null);
    if ((count ?? 0) > 0) return { pase: pase as ValidacionQR["pase"], yaAdentro: true };
  }

  return { pase: pase as ValidacionQR["pase"] };
}

export async function registrarIngresoQR(
  paseId: string,
  esEgreso: boolean,
  _formData: FormData,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: pase } = await supabase
    .from("pases_qr")
    .select("*, residente:residentes(*, lote:lotes(*))")
    .eq("id", paseId)
    .single();

  if (!pase) return;

  if (esEgreso) {
    // Registrar egreso en el último ingreso activo
    await supabase
      .from("ingresos")
      .update({ egresado_at: new Date().toISOString() })
      .eq("residente_id", pase.residente_id)
      .is("egresado_at", null);
  } else {
    // Registrar ingreso
    await supabase.from("ingresos").insert({
      tipo: "qr",
      residente_id: pase.residente_id,
      lote_id: pase.residente?.lote_id ?? null,
      registrado_por: user.id,
    });

    // Si es único uso, desactivar el pase
    if (pase.tipo === "unico_uso") {
      await supabase
        .from("pases_qr")
        .update({ activo: false, usado_at: new Date().toISOString() })
        .eq("id", paseId);
    }
  }

  revalidatePath("/qr");
  revalidatePath("/seguridad");
}
