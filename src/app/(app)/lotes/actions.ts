"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LoteState = { error?: string; success?: boolean } | null;

async function canManageLotes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user) && user?.app_metadata?.rol !== "seguridad";
}

export async function saveLote(
  id: string | null,
  _prev: LoteState,
  formData: FormData,
): Promise<LoteState> {
  if (!(await canManageLotes())) {
    return { error: "Seguridad no puede editar lotes" };
  }

  const supabase = await createClient();
  const numero = (formData.get("numero") as string)?.trim();
  const estado = (formData.get("estado") as string) || "sin_datos";
  const observaciones = (formData.get("observaciones") as string)?.trim() || null;

  if (!numero) return { error: "El número de lote es requerido" };

  if (id) {
    const { error } = await supabase
      .from("lotes")
      .update({ numero, estado, observaciones })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("lotes")
      .insert({ numero, estado, observaciones });
    if (error) return { error: error.message };
  }

  revalidatePath("/lotes");
  return { success: true };
}

export async function cambiarEstadoLote(
  id: string,
  estado: string,
  _formData: FormData,
) {
  if (!(await canManageLotes())) {
    throw new Error("Seguridad no puede editar lotes");
  }

  const supabase = await createClient();
  await supabase.from("lotes").update({ estado }).eq("id", id);
  revalidatePath("/lotes");
}

export async function eliminarLote(id: string, _formData: FormData) {
  if (!(await canManageLotes())) {
    throw new Error("Seguridad no puede borrar lotes");
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("residentes")
    .select("*", { count: "exact", head: true })
    .eq("lote_id", id)
    .eq("activo", true);

  if ((count ?? 0) > 0) return;

  await supabase.from("lotes").delete().eq("id", id);
  revalidatePath("/lotes");
}

export async function cargarLotesBonDesti() {
  if (!(await canManageLotes())) {
    throw new Error("Seguridad no puede editar lotes");
  }

  const supabase = await createClient();
  const rangos = [
    { letra: "C", hasta: 17 },
    { letra: "D", hasta: 17 },
    { letra: "E", hasta: 16 },
    { letra: "F", hasta: 16 },
  ];

  const lotes = rangos.flatMap(({ letra, hasta }) =>
    Array.from({ length: hasta }, (_, index) => ({
      numero: `${letra}-${index + 1}`,
      estado: "disponible",
      observaciones: null,
    })),
  );

  const { error } = await supabase
    .from("lotes")
    .upsert(lotes, { onConflict: "numero", ignoreDuplicates: true });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/lotes");
  revalidatePath("/residentes");
}
