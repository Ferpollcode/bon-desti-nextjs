import { createClient } from "@/lib/supabase/server";
import ConfirmActionForm from "@/components/ConfirmActionForm";
import { formatDateTime, startOfLocalDayIso } from "@/lib/timezone";
import type { IngresoCompleto, Residente, Lote } from "@/lib/types/database";
import RegistroIngreso from "./RegistroIngreso";
import { eliminarIngreso, registrarEgreso } from "./actions";
import EmergencyAlarm from "../emergencias/EmergencyAlarm";

interface SeguridadEmergenciaActiva {
  id: string;
  descripcion: string;
  created_at: string;
  lote: { numero: string } | null;
}

async function getIngresos(): Promise<IngresoCompleto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingresos")
    .select("*, residente:residentes(*), visitante:visitantes(*), lote:lotes(*)")
    .order("ingresado_at", { ascending: false })
    .limit(100);
  return (data ?? []) as IngresoCompleto[];
}

async function getStatsHoy() {
  const supabase = await createClient();
  const todayStart = startOfLocalDayIso();
  const { count: entradas } = await supabase
    .from("ingresos")
    .select("*", { count: "exact", head: true })
    .gte("ingresado_at", todayStart);
  const { count: dentro } = await supabase
    .from("ingresos")
    .select("*", { count: "exact", head: true })
    .gte("ingresado_at", todayStart)
    .is("egresado_at", null);
  return { entradas: entradas ?? 0, dentro: dentro ?? 0 };
}

async function getEmergenciasActivas(): Promise<SeguridadEmergenciaActiva[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("emergencias")
    .select("id, descripcion, created_at, lote:lotes(numero)")
    .eq("estado", "activa")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []).map((emergencia) => ({
    id: emergencia.id,
    descripcion: emergencia.descripcion,
    created_at: emergencia.created_at,
    lote: Array.isArray(emergencia.lote)
      ? (emergencia.lote[0] ?? null)
      : (emergencia.lote ?? null),
  }));
}

async function getResidentesYLotes(): Promise<{
  residentes: Residente[];
  lotes: Lote[];
}> {
  const supabase = await createClient();
  const [{ data: residentes }, { data: lotes }] = await Promise.all([
    supabase
      .from("residentes")
      .select("*")
      .eq("activo", true)
      .order("apellido"),
    supabase.from("lotes").select("*").order("numero"),
  ]);
  return {
    residentes: (residentes ?? []) as Residente[],
    lotes: (lotes ?? []) as Lote[],
  };
}

function formatTs(ts: string) {
  return formatDateTime(ts, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nombreIngreso(ingreso: IngresoCompleto): string {
  if (ingreso.residente)
    return `${ingreso.residente.nombre} ${ingreso.residente.apellido}`;
  if (ingreso.visitante)
    return `${ingreso.visitante.nombre} ${ingreso.visitante.apellido}`;
  return "—";
}

const tipoBadge: Record<string, string> = {
  residente: "badge-green",
  visitante: "badge-blue",
  personal_obra: "badge-amber",
  qr: "badge-blue",
};

const tipoLabel: Record<string, string> = {
  residente: "Residente",
  visitante: "Visita",
  personal_obra: "Personal obra",
  qr: "Visita",
};

export default async function SeguridadPage() {
  const [ingresos, stats, emergenciasActivas, { residentes, lotes }] = await Promise.all([
    getIngresos(),
    getStatsHoy(),
    getEmergenciasActivas(),
    getResidentesYLotes(),
  ]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Registro de accesos</div>
          <div className="page-sub">Historial completo de entradas y salidas</div>
        </div>
        <RegistroIngreso residentes={residentes} lotes={lotes} />
      </div>

      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Entradas hoy</div>
          <div className="stat-value">{stats.entradas}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Dentro ahora</div>
          <div className="stat-value">{stats.dentro}</div>
        </div>
        <div className="stat red">
          <div className="stat-label">Emergencias activas</div>
          <div className="stat-value">{emergenciasActivas.length}</div>
        </div>
      </div>

      <EmergencyAlarm active={emergenciasActivas.length > 0} />

      {emergenciasActivas.length > 0 && (
        <div className="emergency-panel security-emergency-panel">
          <div className="emergency-title">
            <i className="ti ti-alert-triangle" /> Emergencia recibida
          </div>
          {emergenciasActivas.map((emergencia) => (
            <div key={emergencia.id} className="security-emergency-item">
              <strong>{emergencia.descripcion}</strong>
              {emergencia.lote && <span>Lote {emergencia.lote.numero}</span>}
              <a className="btn btn-sm btn-danger call-911-link" href="tel:911">
                <i className="ti ti-phone-call" /> Llamar 911
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="card security-access-card">
        <div className="table-wrap security-access-wrap">
          <table className="security-access-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Lote destino</th>
                <th>Vehículo</th>
                <th>Movimiento</th>
                <th>Notas</th>
                <th className="security-actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      <div className="empty-icon">
                        <i className="ti ti-barrier-block" />
                      </div>
                      Sin registros de acceso
                    </div>
                  </td>
                </tr>
              ) : (
                ingresos.map((ingreso) => (
                  <tr key={ingreso.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatTs(ingreso.ingresado_at)}
                    </td>
                    <td className="security-access-name">{nombreIngreso(ingreso)}</td>
                    <td>
                      <span
                        className={`badge ${tipoBadge[ingreso.tipo] ?? "badge-gray"}`}
                      >
                        {tipoLabel[ingreso.tipo] ?? ingreso.tipo}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {ingreso.lote ? `Lote ${ingreso.lote.numero}` : "—"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{ingreso.patente ?? "—"}</td>
                    <td>
                      <span
                        className={`badge ${ingreso.egresado_at ? "badge-red" : "badge-green"}`}
                      >
                        {ingreso.egresado_at ? "Salida" : "Entrada"}
                      </span>
                    </td>
                    <td className="security-access-notes">
                      {ingreso.visitante
                        ? [
                            `${ingreso.visitante.nombre} ${ingreso.visitante.apellido}`,
                            ingreso.visitante.documento ? `DNI ${ingreso.visitante.documento}` : null,
                          ].filter(Boolean).join(" · ")
                        : (ingreso.notas ?? "—")}
                    </td>
                    <td className="security-access-actions">
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        {!ingreso.egresado_at && (
                          <form action={registrarEgreso.bind(null, ingreso.id)}>
                            <button
                              type="submit"
                              className="btn btn-sm security-icon-btn"
                              title="Registrar egreso"
                              aria-label="Registrar egreso"
                            >
                              <i className="ti ti-door-exit" />
                            </button>
                          </form>
                        )}
                        <ConfirmActionForm
                          action={eliminarIngreso.bind(null, ingreso.id)}
                          message="¿Borrar este ingreso registrado?"
                        >
                          <button
                            type="submit"
                            className="btn btn-sm btn-danger security-icon-btn"
                            title="Borrar ingreso"
                            aria-label="Borrar ingreso"
                          >
                            <i className="ti ti-trash" />
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
