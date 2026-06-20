"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Residente, Lote, PaseQR } from "@/lib/types/database";

export interface ValidacionQR {
  error?: string;
  pase?: PaseQR & { residente: (Residente & { lote: Lote | null }) | null };
  yaAdentro?: boolean;
  restricciones?: string;
}

const DIAS_MAP: Record<string, number> = {
  dom: 0, lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6,
};

function validarRestricciones(pase: PaseQR): string | null {
  const ahora = new Date();

  if (pase.valido_desde) {
    const desde = new Date(pase.valido_desde + "T00:00:00");
    if (ahora < desde) {
      return `No válido hasta ${desde.toLocaleDateString("es-AR")}`;
    }
  }

  if (pase.vence_at && new Date(pase.vence_at) < ahora) {
    return "Pase vencido";
  }

  if (pase.dias_habilitados?.length > 0) {
    const diaHoy = ahora.getDay();
    const diasValidos = pase.dias_habilitados.map((d) => DIAS_MAP[d] ?? -1);
    if (!diasValidos.includes(diaHoy)) {
      return `No válido hoy (días: ${pase.dias_habilitados.join(", ")})`;
    }
  }

  if (pase.hora_desde && pase.hora_hasta) {
    const horaHoy = ahora.toTimeString().slice(0, 5);
    if (horaHoy < pase.hora_desde || horaHoy > pase.hora_hasta) {
      return `Válido solo de ${pase.hora_desde} a ${pase.hora_hasta}`;
    }
  }

  return null;
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

  if (pase.tipo === "temporal") {
    const errorRestricciones = validarRestricciones(pase as PaseQR);
    if (errorRestricciones) return { error: errorRestricciones };

    // Verificar si el visitante ya está adentro en ese lote
    const residenteConLote = pase.residente as (Residente & { lote: Lote | null }) | null;
    const lote_id = residenteConLote?.lote_id;
    if (lote_id) {
      const { count } = await supabase
        .from("ingresos")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "visitante")
        .eq("lote_id", lote_id)
        .is("egresado_at", null);
      if ((count ?? 0) > 0) {
        return { pase: pase as ValidacionQR["pase"], yaAdentro: true };
      }
    }

    const p = pase as PaseQR;
    const restricciones = [
      p.hora_desde && p.hora_hasta ? `${p.hora_desde}–${p.hora_hasta}` : null,
      p.dias_habilitados?.length > 0 ? p.dias_habilitados.join(", ") : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return { pase: pase as ValidacionQR["pase"], restricciones: restricciones || undefined };
  }

  // Token único: validar vencimiento
  if (pase.vence_at && new Date(pase.vence_at) < new Date()) {
    return { error: "Este token está vencido" };
  }

  // Verificar si el residente ya está adentro
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

  const residente = pase.residente as (Residente & { lote: Lote | null }) | null;
  const lote_id = residente?.lote_id ?? null;

  if (esEgreso) {
    if (pase.tipo === "temporal") {
      const { data: ingresoAbierto } = await supabase
        .from("ingresos")
        .select("id")
        .eq("tipo", "visitante")
        .eq("lote_id", lote_id ?? "")
        .is("egresado_at", null)
        .order("ingresado_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ingresoAbierto) {
        await supabase
          .from("ingresos")
          .update({ egresado_at: new Date().toISOString() })
          .eq("id", ingresoAbierto.id);
      }
    } else {
      await supabase
        .from("ingresos")
        .update({ egresado_at: new Date().toISOString() })
        .eq("residente_id", pase.residente_id)
        .is("egresado_at", null);
    }
  } else {
    if (pase.tipo === "temporal") {
      // Crear o reutilizar visitante
      const nombre = (pase as PaseQR).visitante_nombre ?? "Visitante";
      const partes = nombre.split(" ");
      const visitanteNombre = partes[0];
      const visitanteApellido = partes.slice(1).join(" ") || "-";
      const documento = (pase as PaseQR).visitante_documento;

      let visitante_id: string | null = null;

      if (documento) {
        const { data: existing } = await supabase
          .from("visitantes")
          .select("id")
          .eq("documento", documento)
          .maybeSingle();
        visitante_id = existing?.id ?? null;
      }

      if (!visitante_id) {
        const { data: nuevo } = await supabase
          .from("visitantes")
          .insert({
            nombre: visitanteNombre,
            apellido: visitanteApellido,
            documento: documento ?? null,
            lote_id,
          })
          .select("id")
          .single();
        visitante_id = nuevo?.id ?? null;
      }

      await supabase.from("ingresos").insert({
        tipo: "visitante",
        visitante_id,
        residente_id: pase.residente_id,
        lote_id,
        registrado_por: user.id,
        notas: (pase as PaseQR).motivo ?? null,
      });
    } else {
      await supabase.from("ingresos").insert({
        tipo: "qr",
        residente_id: pase.residente_id,
        lote_id,
        registrado_por: user.id,
      });

      if (pase.tipo === "unico_uso") {
        await supabase
          .from("pases_qr")
          .update({ activo: false, usado_at: new Date().toISOString() })
          .eq("id", paseId);
      }
    }
  }

  revalidatePath("/qr");
  revalidatePath("/seguridad");
}
