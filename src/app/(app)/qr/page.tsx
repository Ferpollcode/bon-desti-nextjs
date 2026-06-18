import { createClient } from "@/lib/supabase/server";
import type { PaseQR, Residente } from "@/lib/types/database";

interface PaseConResidente extends PaseQR {
  residente: Residente | null;
}

async function getPases(): Promise<PaseConResidente[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pases_qr")
    .select("*, residente:residentes(*)")
    .order("created_at", { ascending: false });
  return (data ?? []) as PaseConResidente[];
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

const tipoBadge: Record<string, string> = {
  permanente: "badge-blue",
  temporal: "badge-amber",
  unico_uso: "badge-gray",
};

const tipoLabel: Record<string, string> = {
  permanente: "Permanente",
  temporal: "Temporal",
  unico_uso: "Único uso",
};

export default async function QrPage() {
  const pases = await getPases();
  const activos = pases.filter((p) => p.activo);
  const usados = pases.filter((p) => p.usado_at);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Pases QR</div>
          <div className="page-sub">Códigos de acceso generados para residentes y visitantes</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Activos</div>
          <div className="stat-value">{activos.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Usados</div>
          <div className="stat-value">{usados.length}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Total</div>
          <div className="stat-value">{pases.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Residente</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Vence</th>
                <th>Usado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {pases.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-icon"><i className="ti ti-qrcode" /></div>
                      Sin pases QR generados
                    </div>
                  </td>
                </tr>
              ) : (
                pases.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.residente
                        ? `${p.residente.apellido}, ${p.residente.nombre}`
                        : "—"}
                    </td>
                    <td>
                      <span className={`badge ${tipoBadge[p.tipo] ?? "badge-gray"}`}>
                        {tipoLabel[p.tipo] ?? p.tipo}
                      </span>
                    </td>
                    <td>{p.descripcion ?? "—"}</td>
                    <td>
                      <span className={`badge ${p.activo ? "badge-green" : "badge-gray"}`}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{p.vence_at ? formatTs(p.vence_at) : "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{p.usado_at ? formatTs(p.usado_at) : "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatTs(p.created_at)}</td>
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
