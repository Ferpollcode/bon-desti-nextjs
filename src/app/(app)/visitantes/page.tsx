import { createClient } from "@/lib/supabase/server";
import type { Visitante, Lote } from "@/lib/types/database";

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

function formatFecha(ts: string) {
  return new Date(ts).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default async function VisitantesPage() {
  const visitantes = await getVisitantes();

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

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Patente</th>
                <th>Lote destino</th>
                <th>Observaciones</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {visitantes.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="empty-icon"><i className="ti ti-user-question" /></div>
                      Sin visitantes registrados
                    </div>
                  </td>
                </tr>
              ) : (
                visitantes.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.apellido}, {v.nombre}</strong></td>
                    <td>{v.documento ?? "—"}</td>
                    <td>{v.patente ?? "—"}</td>
                    <td>{v.lote ? `Lote ${v.lote.numero}` : "—"}</td>
                    <td>{v.observaciones ?? "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatFecha(v.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
