import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Comunicacion, Residente, Lote, Reclamo } from "@/lib/types/database";
import EmergenciaButton from "./EmergenciaButton";
import LoteSelector from "./LoteSelector";
import TokenUnicoVisita from "./TokenUnicoVisita";
import PaseTemporalForm from "./PaseTemporalForm";
import PasesGenerados from "./PasesGenerados";
import Reclamos from "./Reclamos";

async function getResidentesDelUsuario(
  userId: string,
): Promise<(Residente & { lote: Lote | null })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("residentes")
    .select("*, lote:lotes(*)")
    .eq("profile_id", userId)
    .eq("activo", true);
  return (data ?? []) as (Residente & { lote: Lote | null })[];
}

async function getComunicaciones(
  residenteId: string | null,
): Promise<Comunicacion[]> {
  const supabase = await createClient();
  let query = supabase
    .from("comunicaciones")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  query = residenteId
    ? query.or(`destinatario_tipo.eq.todos,residente_id.eq.${residenteId}`)
    : query.eq("destinatario_tipo", "todos");

  const { data } = await query;
  return (data ?? []) as Comunicacion[];
}

async function getReclamos(residenteId: string | null): Promise<Reclamo[]> {
  if (!residenteId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reclamos")
    .select("*")
    .eq("residente_id", residenteId)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []) as Reclamo[];
}

function formatFechaCorta(ts: string) {
  return new Date(ts).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ lote?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { lote: loteParam } = await searchParams;

  const residentes = user ? await getResidentesDelUsuario(user.id) : [];

  const selectedLoteId =
    loteParam ??
    (residentes.length === 1 ? (residentes[0].lote_id ?? undefined) : undefined);

  const selectedResidente = residentes.find(
    (r) => r.lote_id === selectedLoteId,
  );
  const comunicaciones = await getComunicaciones(selectedResidente?.id ?? null);
  const reclamos = await getReclamos(selectedResidente?.id ?? null);

  return (
    <>
      {/* Mi casa / lote — full width */}
      <div className="owner-card portal-full">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Mi casa / lote</label>
          <LoteSelector
            key={selectedLoteId ?? "none"}
            residentes={residentes}
            selectedLoteId={selectedLoteId}
          />
        </div>
        {selectedResidente && (
          <p className="owner-card-subtitle" style={{ marginTop: 8, marginBottom: 0 }}>
            {selectedResidente.nombre} {selectedResidente.apellido} ·{" "}
            {selectedResidente.tipo === "propietario" ? "Propietario" : "Inquilino"}
          </p>
        )}
        {!selectedLoteId && (
          <p className="owner-card-subtitle" style={{ marginTop: 8, marginBottom: 0 }}>
            Seleccioná tu casa para usar todas las funciones del portal.
          </p>
        )}
      </div>

      {/* Emergencia + Autorizar visita — full width */}
      <div className="owner-card owner-emergency-card portal-full">
        <EmergenciaButton
          loteId={selectedLoteId ?? null}
          residenteNombre={
            selectedResidente
              ? `${selectedResidente.nombre} ${selectedResidente.apellido}`
              : null
          }
        />
        <Link className="btn btn-primary owner-visit-btn" href="#autorizar-visita">
          <i className="ti ti-user-plus" /> AUTORIZAR VISITA
        </Link>
      </div>

      {/* Seguridad ahora */}
      <div className="owner-card">
        <div className="card-title">Seguridad ahora</div>
        <div className="empty" style={{ padding: "24px 0 8px" }}>
          No hay turno activo informado.
        </div>
      </div>

      {/* QR de residentes */}
      <div className="owner-card">
        <div className="card-title">QR de residentes</div>
        <p className="owner-card-subtitle">
          Cada residente puede usar su QR desde el teléfono o impreso en el
          vehículo para registrar ingreso y salida.
        </p>
        <div className="divider" />
        <div className="empty" style={{ padding: "16px 0 8px" }}>
          {selectedLoteId
            ? "Próximamente: generación de QR residentes."
            : "Seleccione su casa para ver los QR de residentes."}
        </div>
      </div>

      {/* Rondines nocturnos */}
      <div className="owner-card">
        <div className="card-title">Rondines nocturnos</div>
        <div className="empty" style={{ padding: "24px 0 8px" }}>
          Todavía no hay rondines nocturnos registrados.
        </div>
      </div>

      {/* Ingresos de proveedores y obra hoy */}
      <div className="owner-card">
        <div className="card-title">Ingresos de proveedores y obra hoy</div>
        <div className="empty" style={{ padding: "24px 0 8px" }}>
          Todavía no hay proveedores ni personal de obra ingresados hoy.
        </div>
      </div>

      {/* Access Control — full width */}
      <div className="owner-card portal-full" id="notificaciones">
        <div className="card-title">Access Control</div>
        <p className="owner-card-subtitle">
          Notificaciones de administración, votaciones virtuales y
          comunicaciones del barrio.
        </p>
        <div className="portal-access-grid">
          <div className="portal-access-item">
            <div className="owner-section-title">Notificaciones</div>
            <div className="portal-access-status">
              {comunicaciones.length === 0
                ? "Sin notificaciones de administración."
                : `${comunicaciones.length} notificaciones disponibles.`}
            </div>
            {comunicaciones.length > 0 && (
              <div className="resident-message-list">
                {comunicaciones.map((comunicacion) => (
                  <div key={comunicacion.id} className="resident-message">
                    <div className="resident-message-header">
                      <strong>{comunicacion.titulo}</strong>
                      <span className="badge badge-gray">
                        {comunicacion.destinatario_tipo === "todos"
                          ? "General"
                          : "Mi casa"}
                      </span>
                    </div>
                    <div className="resident-message-body">
                      {comunicacion.mensaje}
                    </div>
                    <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 8 }}>
                      {formatFechaCorta(comunicacion.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="divider" style={{ display: "none" }} />
          <div className="portal-access-item">
            <div className="owner-section-title">Asambleas virtuales</div>
            <div className="portal-access-status">
              Sin votaciones abiertas.
            </div>
          </div>
        </div>
      </div>

      {/* Mensajería entre residentes */}
      <div className="owner-card">
        <div className="card-title">Mensajería entre residentes</div>
        <div className="form-row">
          <div className="form-group">
            <label>Enviar a</label>
            <select>
              <option value="">-- Seleccionar residente --</option>
            </select>
          </div>
          <div className="form-group">
            <label>Asunto</label>
            <input type="text" placeholder="Ej: reunión, aviso, consulta" />
          </div>
        </div>
        <div className="form-group">
          <label>Mensaje</label>
          <textarea
            placeholder="Escriba el mensaje para otro residente"
            rows={4}
          />
        </div>
        <button className="btn btn-primary" type="button" style={{ gap: 8 }}>
          <i className="ti ti-send" /> Enviar mensaje
        </button>
        <div className="divider" />
        <div className="owner-section-title">Conversaciones de mi casa</div>
        <div className="empty" style={{ padding: "16px 0 8px" }}>
          Seleccione su casa para ver conversaciones.
        </div>
      </div>

      {/* Pases temporales para visitantes */}
      <div className="owner-card visitor-pass-card" id="autorizar-visita">
        <div className="card-title">Pases temporales para visitantes</div>
        <TokenUnicoVisita residenteId={selectedResidente?.id ?? null} />
        <div className="divider" />
        <div className="owner-section-title">Pase QR temporal</div>
        <p className="owner-card-subtitle">
          Para visitas recurrentes: el visitante muestra el QR en la garita.
        </p>
        <PaseTemporalForm residenteId={selectedResidente?.id ?? null} />
        <div className="divider" />
        <div className="owner-section-title">Pases generados</div>
        <PasesGenerados residenteId={selectedResidente?.id ?? null} />
      </div>

      {/* Buzón de reclamos y sugerencias */}
      <div className="owner-card">
        <div className="card-title">Buzón de reclamos y sugerencias</div>
        <Reclamos residenteId={selectedResidente?.id ?? null} reclamos={reclamos} />
      </div>
    </>
  );
}
