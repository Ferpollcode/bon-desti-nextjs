import { createClient } from "@/lib/supabase/server";
import { compareLotes } from "@/lib/lotes";
import type { Lote, ResidenteConLote } from "@/lib/types/database";
import ResidentesManager from "./ResidentesManager";

async function getData(): Promise<{ residentes: ResidenteConLote[]; lotes: Lote[] }> {
  const supabase = await createClient();
  const [{ data: residentes }, { data: lotes }] = await Promise.all([
    supabase
      .from("residentes")
      .select("*, lote:lotes(*)")
      .order("apellido"),
    supabase.from("lotes").select("*").order("numero"),
  ]);
  return {
    residentes: (residentes ?? []) as ResidenteConLote[],
    lotes: ((lotes ?? []) as Lote[]).sort(compareLotes),
  };
}

export default async function ResidentesPage({
  searchParams,
}: {
  searchParams: Promise<{ residente?: string }>;
}) {
  const { residentes, lotes } = await getData();
  const { residente } = await searchParams;
  return (
    <ResidentesManager
      residentes={residentes}
      lotes={lotes}
      selectedResidenteId={residente}
    />
  );
}
