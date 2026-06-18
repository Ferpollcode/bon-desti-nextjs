import { createClient } from "@/lib/supabase/server";
import type { Obra, PersonalObra, Lote } from "@/lib/types/database";

interface ObraCompleta extends Obra {
  lote: Lote | null;
  personal_obra: PersonalObra[];
}

async function getObras(): Promise<ObraCompleta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("obras")
    .select("*, lote:lotes(*), personal_obra(*)")
    .order("created_at", { ascending: false });
  return (data ?? []) as ObraCompleta[];
}

function formatFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const estadoBadge: Record<string, string> = {
  pendiente: "badge-gray",
  activa: "badge-green",
  finalizada: "badge-blue",
  suspendida: "badge-red",
};

const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente",
  activa: "Activa",
  finalizada: "Finalizada",
  suspendida: "Suspendida",
};

export default async function ObrasPage() {
  const obras = await getObras();
  const activas = obras.filter((o) => o.estado === "activa");

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Obras</div>
          <div className="page-sub">Construcciones activas y personal autorizado</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Obras activas</div>
          <div className="stat-value">{activas.length}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Total obras</div>
          <div className="stat-value">{obras.length}</div>
        </div>
        <div className="stat amber">
          <div className="stat-label">Personal total</div>
          <div className="stat-value">{obras.reduce((sum, o) => sum + o.personal_obra.length, 0)}</div>
        </div>
      </div>

      {obras.map((obra) => (
        <div key={obra.id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div className="card-title" style={{ marginBottom: 4 }}>{obra.descripcion}</div>
              <div style={{ color: "var(--text2)", fontSize: 13 }}>
                {obra.lote ? `Lote ${obra.lote.numero}` : "Sin lote"}
                {obra.responsable ? ` · Responsable: ${obra.responsable}` : ""}
              </div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 4 }}>
                Inicio: {formatFecha(obra.inicio)} · Fin estimado: {formatFecha(obra.fin_estimado)}
              </div>
            </div>
            <span className={`badge ${estadoBadge[obra.estado] ?? "badge-gray"}`}>
              {estadoLabel[obra.estado] ?? obra.estado}
            </span>
          </div>

          {obra.personal_obra.length > 0 ? (
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>DNI</th>
                    <th>Horario</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {obra.personal_obra.map((p) => (
                    <tr key={p.id}>
                      <td>{p.apellido}, {p.nombre}</td>
                      <td>{p.dni ?? "—"}</td>
                      <td>
                        {p.horario_inicio && p.horario_fin
                          ? `${p.horario_inicio} – ${p.horario_fin}`
                          : "—"}
                      </td>
                      <td>
                        <span className={`badge ${p.activo ? "badge-green" : "badge-gray"}`}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: "var(--text3)", fontSize: 13, paddingTop: 4 }}>
              Sin personal registrado
            </div>
          )}
        </div>
      ))}

      {obras.length === 0 && (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><i className="ti ti-building-factory-2" /></div>
            Sin obras registradas
          </div>
        </div>
      )}
    </div>
  );
}
