import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { IngresoCompleto } from "@/lib/types/database";

async function getIngresosHoy(): Promise<IngresoCompleto[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("ingresos")
    .select("*, residente:residentes(*), visitante:visitantes(*), lote:lotes(*)")
    .gte("ingresado_at", today + "T00:00:00")
    .order("ingresado_at", { ascending: false })
    .limit(20);
  return (data ?? []) as IngresoCompleto[];
}

async function getEmergenciasActivas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("emergencias")
    .select("*")
    .eq("estado", "activa")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}

function formatHora(ts: string) {
  return new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function nombreIngreso(ingreso: IngresoCompleto): string {
  if (ingreso.residente) return `${ingreso.residente.nombre} ${ingreso.residente.apellido}`;
  if (ingreso.visitante) return `${ingreso.visitante.nombre} ${ingreso.visitante.apellido}`;
  return "—";
}

export default async function PanelPage() {
  const [ingresos, emergencias] = await Promise.all([
    getIngresosHoy(),
    getEmergenciasActivas(),
  ]);

  return (
    <div>
      {emergencias.map((e) => (
        <div key={e.id} className="emergency-panel">
          <div className="emergency-row">
            <div>
              <div className="emergency-title">
                <i className="ti ti-alert-triangle" aria-hidden="true" /> EMERGENCIA ACTIVA
              </div>
              <div style={{ marginTop: 6 }}><strong>{e.descripcion}</strong></div>
              <div className="page-sub">{formatHora(e.created_at)}</div>
            </div>
            <Link href="/emergencias" className="btn btn-danger">Ver emergencias</Link>
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div className="page-title" style={{ fontSize: "clamp(28px, 7vw, 36px)", fontFamily: "Roboto, Arial, sans-serif" }}>
          Panel principal
        </div>
        <div className="page-sub" style={{ fontSize: 16, fontWeight: 500, textAlign: "center" }}>
          Accesos rápidos
        </div>
      </div>

      <div className="main-actions">
        <Link href="/emergencias" className="main-action emergency">
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <span>EMERGENCIA</span>
        </Link>
        <Link href="/seguridad" className="main-action entry">
          <i className="ti ti-login-2" />
          <span>INGRESO</span>
        </Link>
        <Link href="/seguridad" className="main-action qr">
          <i className="ti ti-qrcode" />
          <span>ESCANEAR QR</span>
        </Link>
      </div>

      <div className="card">
        <div className="card-title">Movimientos del día</div>
        {ingresos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><i className="ti ti-barrier-block" /></div>
            Sin movimientos registrados hoy
          </div>
        ) : (
          ingresos.map((ingreso) => (
            <div key={ingreso.id} className="access-entry">
              <div className={`access-dot ${ingreso.egresado_at ? "salida" : "entrada"}`} />
              <div className="access-info">
                <div className="access-name">{nombreIngreso(ingreso)}</div>
                <div className="access-detail">
                  {ingreso.tipo}{ingreso.lote ? ` · Lote ${ingreso.lote.numero}` : ""}
                  {ingreso.patente ? ` · ${ingreso.patente}` : ""}
                </div>
              </div>
              <div className="access-time">{formatHora(ingreso.ingresado_at)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
