"use client";

import { useActionState, useState } from "react";
import {
  generarTokenUnicoVisita,
  type TokenUnicoState,
} from "./actions";
import QRDisplay from "@/components/QRDisplay";
import { tomorrowLocalDateString } from "@/lib/timezone";

const DIAS = [
  { id: "lun", label: "Lun" },
  { id: "mar", label: "Mar" },
  { id: "mie", label: "Mié" },
  { id: "jue", label: "Jue" },
  { id: "vie", label: "Vie" },
  { id: "sab", label: "Sáb" },
  { id: "dom", label: "Dom" },
];

interface TokenUnicoVisitaProps {
  residenteId: string | null;
}

function defaultExpiry() {
  return tomorrowLocalDateString();
}

export default function TokenUnicoVisita({ residenteId }: TokenUnicoVisitaProps) {
  const [state, formAction, pending] = useActionState<TokenUnicoState, FormData>(
    generarTokenUnicoVisita,
    null,
  );
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    if (!state?.token) return;
    await navigator.clipboard.writeText(state.token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <form action={formAction} className="one-use-token">
      <input type="hidden" name="residente_id" value={residenteId ?? ""} />

      <div className="one-use-token-header">
        <div>
          <div className="owner-section-title">Token de único uso</div>
          <p className="owner-card-subtitle">
            Para visitas sin QR: seguridad puede ingresar este token manualmente.
          </p>
        </div>
        <i className="ti ti-ticket" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Nombre del visitante *</label>
          <input
            name="visitante_nombre"
            type="text"
            placeholder="Nombre y apellido"
            disabled={!residenteId || pending}
            required
          />
        </div>
        <div className="form-group">
          <label>DNI / CUIL</label>
          <input
            name="visitante_documento"
            type="text"
            inputMode="numeric"
            placeholder="Documento"
            disabled={!residenteId || pending}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Teléfono / WhatsApp</label>
          <input
            name="visitante_telefono"
            type="text"
            placeholder="Ej: 5492615551234"
            disabled={!residenteId || pending}
          />
        </div>
        <div className="form-group">
          <label>Motivo</label>
          <input
            name="motivo"
            type="text"
            placeholder="Visita, servicio, familiar"
            disabled={!residenteId || pending}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Válido desde</label>
          <input
            name="valido_desde"
            type="date"
            disabled={!residenteId || pending}
          />
        </div>
        <div className="form-group">
          <label>Válido hasta</label>
          <input
            name="vence_at"
            type="date"
            defaultValue={defaultExpiry()}
            disabled={!residenteId || pending}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Horario desde</label>
          <input
            name="hora_desde"
            type="time"
            defaultValue="08:00"
            disabled={!residenteId || pending}
          />
        </div>
        <div className="form-group">
          <label>Horario hasta</label>
          <input
            name="hora_hasta"
            type="time"
            defaultValue="22:00"
            disabled={!residenteId || pending}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Días habilitados</label>
        <div className="days-grid">
          {DIAS.map((d) => (
            <label key={d.id} className="day-check">
              <input
                type="checkbox"
                name="dias_habilitados"
                value={d.id}
                defaultChecked={!["sab", "dom"].includes(d.id)}
                disabled={!residenteId || pending}
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      {!residenteId && (
        <div className="empty" style={{ padding: "10px 0 0" }}>
          Seleccioná tu casa para generar tokens.
        </div>
      )}

      {state?.error && (
        <div className="validation-card fail" style={{ marginTop: 12 }}>
          {state.error}
        </div>
      )}

      {state?.token && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="token-result">
            <div>
              <span>Token generado</span>
              <strong style={{ fontSize: 24, letterSpacing: 4 }}>{state.token}</strong>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={copyToken}
              style={{ gap: 6 }}
            >
              <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <QRDisplay
            value={state.token}
            filename={`token-visita-${state.token}`}
            label="Escaneá este QR en la garita"
            size={180}
          />
        </div>
      )}

      <button
        className="btn btn-primary"
        type="submit"
        disabled={!residenteId || pending}
        style={{ gap: 8, marginTop: 12 }}
      >
        <i className="ti ti-key" />
        {pending ? "Generando..." : "Generar token"}
      </button>
    </form>
  );
}
