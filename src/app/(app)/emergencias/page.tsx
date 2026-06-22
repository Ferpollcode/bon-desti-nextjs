import { createClient } from "@/lib/supabase/server";
import ConfirmActionForm from "@/components/ConfirmActionForm";
import type { EmergenciaCompleta, Lote } from "@/lib/types/database";
import CrearEmergencia from "./CrearEmergencia";
import { cambiarEstadoEmergencia, eliminarEmergencia } from "./actions";

async function getEmergencias(): Promise<EmergenciaCompleta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("emergencias")
    .select(
      "*, lote:lotes(*), reportado_por_profile:profiles!emergencias_reportado_por_fkey(*), atendido_por_profile:profiles!emergencias_atendido_por_fkey(*)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as EmergenciaCompleta[];
}

async function getLotes(): Promise<Lote[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("lotes").select("*").order("numero");
  return (data ?? []) as Lote[];
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const estadoBadge: Record<string, string> = {
  activa: "badge-red",
  en_proceso: "badge-amber",
  resuelta: "badge-green",
  eliminada: "badge-gray",
};

const estadoLabel: Record<string, string> = {
  activa: "Activa",
  en_proceso: "En proceso",
  resuelta: "Resuelta",
  eliminada: "Eliminada",
};

export default async function EmergenciasPage() {
  const [emergencias, lotes] = await Promise.all([
    getEmergencias(),
    getLotes(),
  ]);
  const activas = emergencias.filter((e) => e.estado === "activa");
  const enProceso = emergencias.filter((e) => e.estado === "en_proceso");

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Emergencias</div>
          <div className="page-sub">
            Alertas y situaciones de emergencia del barrio
          </div>
        </div>
        <CrearEmergencia lotes={lotes} />
      </div>

      {activas.length > 0 && (
        <div className="emergency-panel" style={{ marginBottom: 24 }}>
          <div className="emergency-title">
            <i className="ti ti-alert-triangle" /> {activas.length}{" "}
            EMERGENCIA{activas.length !== 1 ? "S" : ""} ACTIVA
            {activas.length !== 1 ? "S" : ""}
          </div>
          {activas.map((e) => (
            <div key={e.id} style={{ marginTop: 8 }}>
              <strong>{e.descripcion}</strong>
              {e.lote && (
                <span style={{ marginLeft: 8, opacity: 0.8 }}>
                  · Lote {e.lote.numero}
                </span>
              )}
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                {formatTs(e.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat red">
          <div className="stat-label">Activas</div>
          <div className="stat-value">{activas.length}</div>
        </div>
        <div className="stat amber">
          <div className="stat-label">En proceso</div>
          <div className="stat-value">{enProceso.length}</div>
        </div>
        <div className="stat green">
          <div className="stat-label">Resueltas</div>
          <div className="stat-value">
            {emergencias.filter((e) => e.estado === "resuelta").length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Total</div>
          <div className="stat-value">{emergencias.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Lote</th>
                <th>Estado</th>
                <th>Reportado por</th>
                <th>Resuelto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {emergencias.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-icon">
                        <i className="ti ti-shield-check" />
                      </div>
                      Sin emergencias registradas
                    </div>
                  </td>
                </tr>
              ) : (
                emergencias.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatTs(e.created_at)}
                    </td>
                    <td>
                      <strong>{e.descripcion}</strong>
                    </td>
                    <td>{e.lote ? `Lote ${e.lote.numero}` : "—"}</td>
                    <td>
                      <span
                        className={`badge ${estadoBadge[e.estado] ?? "badge-gray"}`}
                      >
                        {estadoLabel[e.estado] ?? e.estado}
                      </span>
                    </td>
                    <td>{e.reportado_por_profile?.nombre ?? "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {e.resuelto_at ? formatTs(e.resuelto_at) : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {e.estado === "activa" && (
                          <form
                            action={cambiarEstadoEmergencia.bind(
                              null,
                              e.id,
                              "en_proceso",
                            )}
                          >
                            <button
                              type="submit"
                              className="btn btn-sm"
                              style={{
                                borderColor: "var(--warn)",
                                color: "#ffc27a",
                                gap: 4,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <i className="ti ti-eye" /> Atender
                            </button>
                          </form>
                        )}
                        {(e.estado === "activa" ||
                          e.estado === "en_proceso") && (
                          <form
                            action={cambiarEstadoEmergencia.bind(
                              null,
                              e.id,
                              "resuelta",
                            )}
                          >
                            <button
                              type="submit"
                              className="btn btn-sm"
                              style={{
                                borderColor: "var(--accent)",
                                color: "var(--accent-text)",
                                gap: 4,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <i className="ti ti-circle-check" /> Resolver
                            </button>
                          </form>
                        )}
                        <ConfirmActionForm
                          action={eliminarEmergencia.bind(null, e.id)}
                          message="¿Borrar esta emergencia registrada?"
                        >
                          <button
                            type="submit"
                            className="btn btn-sm btn-danger"
                            style={{ gap: 4, whiteSpace: "nowrap" }}
                          >
                            <i className="ti ti-trash" /> Borrar
                          </button>
                        </ConfirmActionForm>
                      </div>
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
