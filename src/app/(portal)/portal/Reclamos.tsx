"use client";

import { useActionState, useState } from "react";
import { enviarReclamo, type ReclamoState } from "./actions";
import { formatDate } from "@/lib/timezone";
import type { Reclamo } from "@/lib/types/database";

interface Props {
  residenteId: string | null;
  reclamos: Reclamo[];
}

const estadoBadge: Record<string, string> = {
  pendiente: "badge-amber",
  en_proceso: "badge-blue",
  resuelto: "badge-green",
};

const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};

export default function Reclamos({ residenteId, reclamos }: Props) {
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState<ReclamoState, FormData>(
    enviarReclamo,
    null,
  );

  return (
    <div>
      {state?.success ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <i
            className="ti ti-circle-check"
            style={{ color: "var(--accent)", fontSize: 36, display: "block", marginBottom: 8 }}
          />
          <strong>Reclamo enviado</strong>
          <p style={{ color: "var(--text2)", fontSize: 13, margin: "4px 0 16px" }}>
            La administración lo recibirá y dará seguimiento.
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => setFormKey((k) => k + 1)}
          >
            Enviar otro reclamo
          </button>
        </div>
      ) : (
        <form key={formKey} action={formAction}>
          <input type="hidden" name="residente_id" value={residenteId ?? ""} />
          <div className="form-row">
            <div className="form-group">
              <label>Enviar a</label>
              <select name="destinatario" defaultValue="administracion" disabled={!residenteId}>
                <option value="administracion">Administración</option>
                <option value="seguridad">Seguridad</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select name="tipo" defaultValue="reclamo" disabled={!residenteId}>
                <option value="denuncia">Denuncia</option>
                <option value="reclamo">Reclamo</option>
                <option value="sugerencia">Sugerencia</option>
                <option value="consulta">Consulta</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Asunto *</label>
            <input
              name="asunto"
              type="text"
              placeholder="Ej: luminaria, ruido, acceso, mantenimiento"
              disabled={!residenteId}
              required
            />
          </div>
          <div className="form-group">
            <label>Mensaje *</label>
            <textarea
              name="mensaje"
              placeholder="Escribá el detalle para que puedan darle seguimiento"
              rows={4}
              disabled={!residenteId}
              required
            />
          </div>
          {!residenteId && (
            <div className="empty" style={{ padding: "8px 0" }}>
              Seleccioná tu casa para enviar reclamos.
            </div>
          )}
          {state?.error && (
            <div className="validation-card fail" style={{ marginBottom: 12 }}>
              {state.error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!residenteId || pending}
            style={{ gap: 8 }}
          >
            <i className="ti ti-send" />
            {pending ? "Enviando..." : "Enviar"}
          </button>
        </form>
      )}

      {reclamos.length > 0 && (
        <>
          <div className="divider" style={{ margin: "20px 0" }} />
          <div className="owner-section-title">Mis últimos mensajes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {reclamos.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ fontSize: 14 }}>{r.asunto}</strong>
                  <span className={`badge ${estadoBadge[r.estado] ?? "badge-gray"}`}>
                    {estadoLabel[r.estado] ?? r.estado}
                  </span>
                </div>
                <p style={{ color: "var(--text2)", fontSize: 13, margin: "0 0 4px" }}>
                  {r.mensaje}
                </p>
                {r.respuesta && (
                  <div
                    style={{
                      background: "var(--surface2)",
                      borderRadius: 6,
                      marginTop: 8,
                      padding: "8px 10px",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "var(--text3)", fontSize: 11 }}>
                      Respuesta de administración
                    </span>
                    <p style={{ margin: "2px 0 0", color: "var(--text1)" }}>{r.respuesta}</p>
                  </div>
                )}
                <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 8 }}>
                  {formatDate(r.created_at, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })} · {r.tipo} →{" "}
                  {r.destinatario}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
