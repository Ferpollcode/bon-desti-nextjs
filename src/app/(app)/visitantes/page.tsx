import { createClient } from "@/lib/supabase/server";
import type { Lote, Visitante } from "@/lib/types/database";
import VisitantesManager from "./VisitantesManager";

interface VisitanteConLote extends Visitante {
  lote: Lote | null;
}

async function getVisitantes(): Promise<VisitanteConLote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("visitantes")
    .select("*, lote:lotes(*)")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as VisitanteConLote[];
}

async function getLotes(): Promise<Lote[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("lotes").select("*").order("numero");
  return (data ?? []) as Lote[];
}

export default async function VisitantesPage() {
  const [visitantes, lotes] = await Promise.all([getVisitantes(), getLotes()]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Visitantes</div>
          <div className="page-sub">Registro de personas que ingresaron al barrio</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Total registros</div>
          <div className="stat-value">{visitantes.length}</div>
        </div>
      </div>

      <VisitantesManager visitantes={visitantes} lotes={lotes} />
    </div>
  );
}
