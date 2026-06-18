import { createClient } from "@/lib/supabase/server";
import type { ResidenteConLote } from "@/lib/types/database";

async function getResidentes(): Promise<ResidenteConLote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("residentes")
    .select("*, lote:lotes(*)")
    .order("apellido");
  return (data ?? []) as ResidenteConLote[];
}

export default async function ResidentesPage() {
  const residentes = await getResidentes();
  const activos = residentes.filter((r) => r.activo);
  const inactivos = residentes.filter((r) => !r.activo);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Residentes</div>
          <div className="page-sub">Personas autorizadas a vivir en el barrio</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Total residentes</div>
          <div className="stat-value">{residentes.length}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Activos</div>
          <div className="stat-value">{activos.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Inactivos</div>
          <div className="stat-value">{inactivos.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Lote</th>
                <th>Tipo</th>
                <th>Teléfono</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {residentes.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="empty-icon"><i className="ti ti-users" /></div>
                      Sin residentes registrados
                    </div>
                  </td>
                </tr>
              ) : (
                residentes.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.apellido}, {r.nombre}</strong></td>
                    <td>{r.dni ?? "—"}</td>
                    <td>{r.lote ? `Lote ${r.lote.numero}` : "—"}</td>
                    <td>
                      <span className={`badge ${r.tipo === "propietario" ? "badge-green" : "badge-blue"}`}>
                        {r.tipo === "propietario" ? "Propietario" : "Inquilino"}
                      </span>
                    </td>
                    <td>{r.telefono ?? "—"}</td>
                    <td>
                      <span className={`badge ${r.activo ? "badge-green" : "badge-gray"}`}>
                        {r.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
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
