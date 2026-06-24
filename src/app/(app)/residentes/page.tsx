import { createClient } from "@/lib/supabase/server";
import { compareLotes } from "@/lib/lotes";
import type { Lote, ResidenteConLote, Rol } from "@/lib/types/database";
import ResidentesManager from "./ResidentesManager";

async function getData(): Promise<{ residentes: ResidenteConLote[]; lotes: Lote[]; rol: Rol }> {
  const supabase = await createClient();
  const [
    { data: { user } },
    { data: residentes },
    { data: lotes },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("residentes")
      .select("*, lote:lotes(*)")
      .order("apellido"),
    supabase.from("lotes").select("*").order("numero"),
  ]);
  return {
    residentes: (residentes ?? []) as ResidenteConLote[],
    lotes: ((lotes ?? []) as Lote[]).sort(compareLotes),
    rol: ((user?.app_metadata?.rol as Rol | undefined) ?? "seguridad"),
  };
}

export default async function ResidentesPage({
  searchParams,
}: {
  searchParams: Promise<{ residente?: string }>;
}) {
  const { residentes, lotes, rol } = await getData();
  const { residente } = await searchParams;
  return (
    <ResidentesManager
      residentes={residentes}
      lotes={lotes}
      rol={rol}
      selectedResidenteId={residente}
    />
  );
}
