"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PortalState = { error?: string; success?: boolean } | null;

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
