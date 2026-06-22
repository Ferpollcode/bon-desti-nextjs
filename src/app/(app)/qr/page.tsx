import { createClient } from "@/lib/supabase/server";
import type { PaseQR, Residente } from "@/lib/types/database";
import QRScanner from "./QRScanner";

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
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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

type QrPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function QrPage({ searchParams }: QrPageProps) {
  const modoParam = (await searchParams).modo;
  const modo = modoParam === "scan" || modoParam === "token" ? modoParam : "all";
  const pases = await getPases();
  const activos = pases.filter((p) => p.activo);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            {modo === "token" ? "Ingresar token" : "Escáner QR"}
          </div>
          <div className="page-sub">
            {modo === "token"
              ? "Registrá accesos ingresando el token manualmente"
              : "Registrá accesos escaneando el código del residente"}
          </div>
        </div>
      </div>

      <QRScanner mode={modo} />

      {/* Pases registrados */}
      <div style={{ marginTop: 24 }}>
        <div className="stats-grid">
          <div className="stat green">
            <div className="stat-label">Pases activos</div>
            <div className="stat-value">{activos.length}</div>
          </div>
          <div className="stat blue">
            <div className="stat-label">Total</div>
            <div className="stat-value">{pases.length}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Pases QR registrados</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Residente</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Vence</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {pases.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty">
                        <div className="empty-icon">
                          <i className="ti ti-qrcode" />
                        </div>
                        Sin pases QR generados
                      </div>
                    </td>
                  </tr>
                ) : (
                  pases.map((p) => (
                    <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.5 }}>
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
                      <td>
                        <span className={`badge ${p.activo ? "badge-green" : "badge-gray"}`}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {p.vence_at ? formatTs(p.vence_at) : "—"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {formatTs(p.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
