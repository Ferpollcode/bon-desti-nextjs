import { createClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/lib/types/database";

async function getLogs(): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as AuditLog[];
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

const accionBadge: Record<string, string> = {
  crear: "badge-green",
  editar: "badge-blue",
  eliminar: "badge-red",
  login: "badge-amber",
  logout: "badge-gray",
};

export default async function AuditoriaPage() {
  const logs = await getLogs();

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Auditoría</div>
          <div className="page-sub">Registro de acciones realizadas en el sistema</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat blue">
          <div className="stat-label">Registros (últimos 200)</div>
          <div className="stat-value">{logs.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Actor</th>
                <th>Rol</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Detalle</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-icon"><i className="ti ti-list-search" /></div>
                      Sin registros de auditoría
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatTs(log.created_at)}</td>
                    <td>{log.actor_id ? log.actor_id.slice(0, 8) + "…" : "—"}</td>
                    <td>
                      {log.rol ? (
                        <span className="badge badge-gray" style={{ textTransform: "capitalize" }}>
                          {log.rol}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`badge ${accionBadge[log.accion] ?? "badge-gray"}`} style={{ textTransform: "capitalize" }}>
                        {log.accion}
                      </span>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{log.entidad}</td>
                    <td>{log.detalle ?? "—"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{log.ip_address ?? "—"}</td>
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
