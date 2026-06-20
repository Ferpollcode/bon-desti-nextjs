import { requireRole } from "@/lib/dal/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Comunicacion,
  IngresoCompleto,
  Lote,
  Residente,
  ReclamoCompleto,
} from "@/lib/types/database";
import ComunicacionForm from "./ComunicacionForm";
import ReclamosAdmin from "./ReclamosAdmin";

interface ResidenteConLote extends Residente {
  lote: Lote | null;
}

interface ComunicacionConResidente extends Comunicacion {
  residente: ResidenteConLote | null;
}

async function getStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: ingresosHoy },
    { count: visitasHoy },
    { count: dentroAhora },
    { count: vehiculosVisitas },
    { count: residentes },
    { count: lotes },
    { count: emergenciasActivas },
  ] = await Promise.all([
    supabase
      .from("ingresos")
      .select("*", { count: "exact", head: true })
      .gte("ingresado_at", today + "T00:00:00"),
    supabase
      .from("ingresos")
      .select("*", { count: "exact", head: true })
      .eq("tipo", "visitante")
      .gte("ingresado_at", today + "T00:00:00"),
    supabase
      .from("ingresos")
      .select("*", { count: "exact", head: true })
      .is("egresado_at", null),
    supabase
      .from("ingresos")
      .select("*", { count: "exact", head: true })
      .eq("tipo", "visitante")
      .not("patente", "is", null),
    supabase
      .from("residentes")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase.from("lotes").select("*", { count: "exact", head: true }),
    supabase
      .from("emergencias")
      .select("*", { count: "exact", head: true })
      .eq("estado", "activa")
      .is("deleted_at", null),
  ]);

  return {
    ingresosHoy: ingresosHoy ?? 0,
    visitasHoy: visitasHoy ?? 0,
    dentroAhora: dentroAhora ?? 0,
    vehiculosVisitas: vehiculosVisitas ?? 0,
    residentes: residentes ?? 0,
    lotes: lotes ?? 0,
    emergenciasActivas: emergenciasActivas ?? 0,
  };
}

async function getVehiculosVisitas(): Promise<IngresoCompleto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingresos")
    .select("*, visitante:visitantes(*), residente:residentes(*), lote:lotes(*)")
    .eq("tipo", "visitante")
    .not("patente", "is", null)
    .order("ingresado_at", { ascending: false })
    .limit(300);
  return (data ?? []) as IngresoCompleto[];
}

async function getResidentes(): Promise<ResidenteConLote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("residentes")
    .select("*, lote:lotes(*)")
    .eq("activo", true)
    .order("apellido");
  return (data ?? []) as ResidenteConLote[];
}

async function getReclamos(): Promise<ReclamoCompleto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reclamos")
    .select(
      "*, residente:residentes(*, lote:lotes(*)), atendido_por_profile:profiles!reclamos_atendido_por_fkey(nombre, apellido)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as ReclamoCompleto[];
}

async function getComunicaciones(): Promise<ComunicacionConResidente[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comunicaciones")
    .select("*, residente:residentes(*, lote:lotes(*))")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as ComunicacionConResidente[];
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nombreIngreso(ingreso: IngresoCompleto) {
  if (ingreso.visitante) return `${ingreso.visitante.apellido}, ${ingreso.visitante.nombre}`;
  if (ingreso.residente) return `${ingreso.residente.apellido}, ${ingreso.residente.nombre}`;
  return "—";
}

export default async function AdministracionPage() {
  await requireRole("admin");

  const [stats, vehiculos, residentes, comunicaciones, reclamos] = await Promise.all([
    getStats(),
    getVehiculosVisitas(),
    getResidentes(),
    getComunicaciones(),
    getReclamos(),
  ]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Administración</div>
          <div className="page-sub">
            Estadísticas, vehículos de visitas y comunicaciones a residentes
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Ingresos hoy</div>
          <div className="stat-value">{stats.ingresosHoy}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Visitas hoy</div>
          <div className="stat-value">{stats.visitasHoy}</div>
        </div>
        <div className="stat amber">
          <div className="stat-label">Dentro ahora</div>
          <div className="stat-value">{stats.dentroAhora}</div>
        </div>
        <div className="stat purple">
          <div className="stat-label">Vehículos de visitas</div>
          <div className="stat-value">{stats.vehiculosVisitas}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Residentes activos</div>
          <div className="stat-value">{stats.residentes}</div>
        </div>
        <div className="stat green">
          <div className="stat-label">Lotes</div>
          <div className="stat-value">{stats.lotes}</div>
        </div>
        <div className="stat amber">
          <div className="stat-label">Emergencias activas</div>
          <div className="stat-value">{stats.emergenciasActivas}</div>
        </div>
      </div>

      <div className="dashboard-panels">
        <div className="card">
          <div className="card-title">Enviar comunicación</div>
          <ComunicacionForm residentes={residentes} />
        </div>

        <div className="card">
          <div className="card-title">Últimas comunicaciones</div>
          {comunicaciones.length === 0 ? (
            <div className="empty">Sin comunicaciones enviadas</div>
          ) : (
            <div className="resident-message-list">
              {comunicaciones.map((comunicacion) => (
                <div key={comunicacion.id} className="resident-message">
                  <div className="resident-message-header">
                    <strong>{comunicacion.titulo}</strong>
                    <span className="badge badge-gray">
                      {comunicacion.destinatario_tipo === "todos"
                        ? "Todos"
                        : comunicacion.residente
                          ? `Lote ${comunicacion.residente.lote?.numero ?? "—"}`
                          : "Residente"}
                    </span>
                  </div>
                  <p>{comunicacion.mensaje}</p>
                  <small>{formatTs(comunicacion.created_at)}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Vehículos ingresados de visitas</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Visitante</th>
                <th>Documento</th>
                <th>Patente</th>
                <th>Lote destino</th>
                <th>Movimiento</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-icon"><i className="ti ti-car" /></div>
                      Sin vehículos de visitas registrados
                    </div>
                  </td>
                </tr>
              ) : (
                vehiculos.map((ingreso) => (
                  <tr key={ingreso.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatTs(ingreso.ingresado_at)}</td>
                    <td><strong>{nombreIngreso(ingreso)}</strong></td>
                    <td>{ingreso.visitante?.documento ?? "—"}</td>
                    <td>{ingreso.patente ?? "—"}</td>
                    <td>{ingreso.lote ? `Lote ${ingreso.lote.numero}` : "—"}</td>
                    <td>
                      <span className={`badge ${ingreso.egresado_at ? "badge-red" : "badge-green"}`}>
                        {ingreso.egresado_at ? "Salió" : "Dentro"}
                      </span>
                    </td>
                    <td>
                      {ingreso.visitante
                        ? [
                            `${ingreso.visitante.nombre} ${ingreso.visitante.apellido}`,
                            ingreso.visitante.documento ? `DNI ${ingreso.visitante.documento}` : null,
                          ].filter(Boolean).join(" · ")
                        : (ingreso.notas ?? "—")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">Buzón de reclamos y sugerencias</div>
        <ReclamosAdmin reclamos={reclamos} />
      </div>
    </div>
  );
}
