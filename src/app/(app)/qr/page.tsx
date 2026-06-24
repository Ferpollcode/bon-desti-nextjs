import { createClient } from "@/lib/supabase/server";
import type { Lote, PaseQR, Residente } from "@/lib/types/database";
import PasesRegistrados from "./PasesRegistrados";
import QRScanner from "./QRScanner";

interface PaseConResidente extends PaseQR {
  residente: (Residente & { lote: Lote | null }) | null;
}

async function getPases(): Promise<PaseConResidente[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pases_qr")
    .select("*, residente:residentes(*, lote:lotes(*))")
    .order("created_at", { ascending: false });
  return (data ?? []) as PaseConResidente[];
}

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
            {modo === "token" ? "Ingresar token" : "Escaner QR"}
          </div>
          <div className="page-sub">
            {modo === "token"
              ? "Registra accesos ingresando el token manualmente"
              : "Registra accesos escaneando el codigo del residente"}
          </div>
        </div>
      </div>

      <QRScanner mode={modo} />

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

        <PasesRegistrados pases={pases} />
      </div>
    </div>
  );
}
