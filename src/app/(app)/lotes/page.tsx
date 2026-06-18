import { createClient } from "@/lib/supabase/server";
import type { Lote, Residente } from "@/lib/types/database";

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

const estadoBadge: Record<string, string> = {
  ocupado: "badge-green",
  disponible: "badge-gray",
  en_obra: "badge-amber",
  sin_datos: "badge-gray",
};

const estadoLabel: Record<string, string> = {
  ocupado: "Ocupado",
  disponible: "Disponible",
  en_obra: "En obra",
  sin_datos: "Sin datos",
};

export default async function LotesPage() {
  const lotes = await getLotes();

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Propietarios</div>
          <div className="page-sub">Casas, residentes y personas autorizadas a ingresar</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Total lotes</div>
          <div className="stat-value">{lotes.length}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Ocupados</div>
          <div className="stat-value">{lotes.filter((l) => l.estado === "ocupado").length}</div>
        </div>
        <div className="stat amber">
          <div className="stat-label">En obra</div>
          <div className="stat-value">{lotes.filter((l) => l.estado === "en_obra").length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Sin datos</div>
          <div className="stat-value">{lotes.filter((l) => l.estado === "sin_datos" || l.estado === "disponible").length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lote</th>
                <th>Estado</th>
                <th>Residentes</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {lotes.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty">
                      <div className="empty-icon"><i className="ti ti-home-shield" /></div>
                      Sin lotes registrados
                    </div>
                  </td>
                </tr>
              ) : (
                lotes.map((lote) => (
                  <tr key={lote.id}>
                    <td><strong>Lote {lote.numero}</strong></td>
                    <td>
                      <span className={`badge ${estadoBadge[lote.estado] ?? "badge-gray"}`}>
                        {estadoLabel[lote.estado] ?? lote.estado}
                      </span>
                    </td>
                    <td>
                      {lote.residentes.length > 0
                        ? lote.residentes.map((r) => `${r.nombre} ${r.apellido}`).join(", ")
                        : <span style={{ color: "var(--text3)" }}>—</span>}
                    </td>
                    <td>{lote.observaciones ?? "—"}</td>
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
