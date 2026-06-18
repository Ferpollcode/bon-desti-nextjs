"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ObraState = { error?: string; success?: boolean } | null;

export async function saveObra(
  id: string | null,
  _prev: ObraState,
  formData: FormData,
): Promise<ObraState> {
  const supabase = await createClient();
  const lote_id = (formData.get("lote_id") as string) || null;
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const responsable = (formData.get("responsable") as string)?.trim() || null;
  const inicio = (formData.get("inicio") as string) || null;
  const fin_estimado = (formData.get("fin_estimado") as string) || null;
  const estado = (formData.get("estado") as string) || "pendiente";

  if (!descripcion) return { error: "La descripción es requerida" };
  if (!lote_id) return { error: "El lote es requerido" };

  if (id) {
    const { error } = await supabase
      .from("obras")
      .update({ lote_id, descripcion, responsable, inicio, fin_estimado, estado })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("obras")
      .insert({ lote_id, descripcion, responsable, inicio, fin_estimado, estado });
    if (error) return { error: error.message };
  }

  revalidatePath("/obras");
  return { success: true };
}

export async function cambiarEstadoObra(
  id: string,
  estado: string,
  _formData: FormData,
) {
  const supabase = await createClient();
  await supabase.from("obras").update({ estado }).eq("id", id);
  revalidatePath("/obras");
}

export async function savePersonalObra(
  obraId: string,
  _prev: ObraState,
  formData: FormData,
): Promise<ObraState> {
  const supabase = await createClient();
  const nombre = (formData.get("nombre") as string)?.trim();
  const apellido = (formData.get("apellido") as string)?.trim();
  const dni = (formData.get("dni") as string)?.trim() || null;
  const horario_inicio = (formData.get("horario_inicio") as string) || null;
  const horario_fin = (formData.get("horario_fin") as string) || null;

  if (!nombre || !apellido) return { error: "Nombre y apellido son requeridos" };

  const { error } = await supabase.from("personal_obra").insert({
    obra_id: obraId,
    nombre,
    apellido,
    dni,
    horario_inicio,
    horario_fin,
    activo: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/obras");
  return { success: true };
}

export async function toggleActivoPersonal(
  id: string,
  activo: boolean,
  _formData: FormData,
) {
  const supabase = await createClient();
  await supabase
    .from("personal_obra")
    .update({ activo: !activo })
    .eq("id", id);
  revalidatePath("/obras");
}
