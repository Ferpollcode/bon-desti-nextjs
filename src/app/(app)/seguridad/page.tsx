import { createClient } from "@/lib/supabase/server";
import type { IngresoCompleto } from "@/lib/types/database";

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
  const today = new Date().toISOString().slice(0, 10);
  const { count: entradas } = await supabase
    .from("ingresos")
    .select("*", { count: "exact", head: true })
    .gte("ingresado_at", today + "T00:00:00");
  const { count: dentro } = await supabase
    .from("ingresos")
    .select("*", { count: "exact", head: true })
    .gte("ingresado_at", today + "T00:00:00")
    .is("egresado_at", null);
  return { entradas: entradas ?? 0, dentro: dentro ?? 0 };
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function nombreIngreso(ingreso: IngresoCompleto): string {
  if (ingreso.residente) return `${ingreso.residente.nombre} ${ingreso.residente.apellido}`;
  if (ingreso.visitante) return `${ingreso.visitante.nombre} ${ingreso.visitante.apellido}`;
  return "—";
}

const tipoBadge: Record<string, string> = {
  residente: "badge-green",
  visitante: "badge-blue",
  personal_obra: "badge-amber",
  qr: "badge-gray",
};

const tipoLabel: Record<string, string> = {
  residente: "Residente",
  visitante: "Visita",
  personal_obra: "Personal obra",
  qr: "QR",
};

export default async function SeguridadPage() {
  const [ingresos, stats] = await Promise.all([getIngresos(), getStatsHoy()]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Registro de accesos</div>
          <div className="page-sub">Historial completo de entradas y salidas</div>
        </div>
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
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Lote destino</th>
                <th>Vehículo</th>
                <th>Movimiento</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-icon"><i className="ti ti-barrier-block" /></div>
                      Sin registros de acceso
                    </div>
                  </td>
                </tr>
              ) : (
                ingresos.map((ingreso) => (
                  <tr key={ingreso.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatTs(ingreso.ingresado_at)}</td>
                    <td>{nombreIngreso(ingreso)}</td>
                    <td>
                      <span className={`badge ${tipoBadge[ingreso.tipo] ?? "badge-gray"}`}>
                        {tipoLabel[ingreso.tipo] ?? ingreso.tipo}
                      </span>
                    </td>
                    <td>{ingreso.lote ? `Lote ${ingreso.lote.numero}` : "—"}</td>
                    <td>{ingreso.patente ?? "—"}</td>
                    <td>
                      <span className={`badge ${ingreso.egresado_at ? "badge-red" : "badge-green"}`}>
                        {ingreso.egresado_at ? "Salida" : "Entrada"}
                      </span>
                    </td>
                    <td>{ingreso.notas ?? "—"}</td>
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
