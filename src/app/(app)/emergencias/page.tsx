import { createClient } from "@/lib/supabase/server";
import ConfirmActionForm from "@/components/ConfirmActionForm";
import { formatDateTime } from "@/lib/timezone";
import type { EmergenciaCompleta, Lote, Residente } from "@/lib/types/database";
import CrearEmergencia from "./CrearEmergencia";
import EmergencyAlarm from "./EmergencyAlarm";
import { eliminarEmergencia, toggleEmergenciaResuelta } from "./actions";

interface EmergenciaConReportante extends EmergenciaCompleta {
  reportado_por_residente: Residente | null;
}

async function getEmergencias(): Promise<EmergenciaConReportante[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("emergencias")
    .select(
      "*, lote:lotes(*), reportado_por_profile:profiles!emergencias_reportado_por_fkey(*), atendido_por_profile:profiles!emergencias_atendido_por_fkey(*)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const emergencias = (data ?? []) as EmergenciaCompleta[];
  const reportadoPorIds = Array.from(
    new Set(emergencias.map((e) => e.reportado_por).filter(Boolean) as string[]),
  );

  if (reportadoPorIds.length === 0) {
    return emergencias.map((e) => ({ ...e, reportado_por_residente: null }));
  }

  const { data: residentes } = await supabase
    .from("residentes")
    .select("*")
    .in("profile_id", reportadoPorIds);

  const residentePorProfile = new Map(
    ((residentes ?? []) as Residente[]).map((residente) => [
      residente.profile_id,
      residente,
    ]),
  );

  return emergencias.map((e) => ({
    ...e,
    reportado_por_residente: e.reportado_por
      ? (residentePorProfile.get(e.reportado_por) ?? null)
      : null,
  }));
}

async function getLotes(): Promise<Lote[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("lotes").select("*").order("numero");
  return (data ?? []) as Lote[];
}

function formatTs(ts: string) {
  return formatDateTime(ts, {
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

function nombreReportante(e: EmergenciaConReportante) {
  if (e.reportado_por_profile?.nombre || e.reportado_por_profile?.apellido) {
    return [e.reportado_por_profile.nombre, e.reportado_por_profile.apellido]
      .filter(Boolean)
      .join(" ");
  }

  if (e.reportado_por_residente) {
    return `${e.reportado_por_residente.nombre} ${e.reportado_por_residente.apellido}`;
  }

  return "—";
}

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

      <EmergencyAlarm active={activas.length > 0} />

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
              <a
                className="btn btn-sm btn-danger call-911-link"
                href="tel:911"
                style={{ marginTop: 8, gap: 4 }}
              >
                <i className="ti ti-phone-call" /> Llamar 911
              </a>
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
        <div className="table-wrap emergencias-table-wrap">
          <table className="emergencias-table">
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
                    <td title={e.descripcion}>
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
                    <td title={nombreReportante(e)}>{nombreReportante(e)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {e.resuelto_at ? formatTs(e.resuelto_at) : "—"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        {e.estado !== "resuelta" && (
                          <a
                            className="btn btn-sm btn-danger call-911-link"
                            href="tel:911"
                            style={{ gap: 4, whiteSpace: "nowrap" }}
                          >
                            <i className="ti ti-phone-call" /> 911
                          </a>
                        )}
                        <form
                          action={toggleEmergenciaResuelta.bind(
                            null,
                            e.id,
                            e.estado,
                          )}
                        >
                          <button
                            type="submit"
                            className="btn btn-sm"
                            style={{
                              borderColor:
                                e.estado === "resuelta" ? "var(--accent)" : "var(--border2)",
                              color:
                                e.estado === "resuelta" ? "var(--accent-text)" : "var(--text)",
                              gap: 4,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <i
                              className={`ti ${
                                e.estado === "resuelta" ? "ti-toggle-right" : "ti-toggle-left"
                              }`}
                            />{" "}
                            Resuelta
                          </button>
                        </form>
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
