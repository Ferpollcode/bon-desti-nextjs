import { createClient } from "@/lib/supabase/server";
import type { Lote, Obra, PersonalObra } from "@/lib/types/database";
import ObrasManager from "./ObrasManager";

interface ObraCompleta extends Obra {
  lote: Lote | null;
  personal_obra: PersonalObra[];
}

async function getData(): Promise<{ obras: ObraCompleta[]; lotes: Lote[] }> {
  const supabase = await createClient();
  const [{ data: obras }, { data: lotes }] = await Promise.all([
    supabase
      .from("obras")
      .select("*, lote:lotes(*), personal_obra(*)")
      .order("created_at", { ascending: false }),
    supabase.from("lotes").select("*").order("numero"),
  ]);
  return {
    obras: (obras ?? []) as ObraCompleta[],
    lotes: (lotes ?? []) as Lote[],
  };
}

export default async function ObrasPage() {
  const { obras, lotes } = await getData();
  return <ObrasManager obras={obras} lotes={lotes} />;
}
