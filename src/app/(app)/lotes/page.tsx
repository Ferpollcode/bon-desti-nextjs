import { createClient } from "@/lib/supabase/server";
import type { Lote, Residente } from "@/lib/types/database";
import LotesManager from "./LotesManager";

interface LoteConResidentes extends Lote {
  residentes: Residente[];
}

async function getLotes(): Promise<LoteConResidentes[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lotes")
    .select("*, residentes(*)")
    .order("numero");
  return (data ?? []) as LoteConResidentes[];
}

export default async function LotesPage() {
  const lotes = await getLotes();
  return <LotesManager lotes={lotes} />;
}
