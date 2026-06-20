"use client";

import { useActionState, useState } from "react";
import {
  generarTokenUnicoVisita,
  type TokenUnicoState,
} from "./actions";
import QRDisplay from "@/components/QRDisplay";

interface TokenUnicoVisitaProps {
  residenteId: string | null;
}

function defaultExpiry() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
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
          <label>Nombre del visitante</label>
          <input
            name="visitante"
            type="text"
            placeholder="Nombre y apellido"
            disabled={!residenteId || pending}
            required
          />
        </div>
        <div className="form-group">
          <label>DNI</label>
          <input
            name="documento"
            type="text"
            inputMode="numeric"
            placeholder="Documento"
            disabled={!residenteId || pending}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Vence</label>
          <input
            name="vence_at"
            type="date"
            defaultValue={defaultExpiry()}
            disabled={!residenteId || pending}
          />
        </div>
        <div className="form-group token-action-cell">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!residenteId || pending}
            style={{ gap: 8 }}
          >
            <i className="ti ti-key" />
            {pending ? "Generando..." : "Generar token"}
          </button>
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
    </form>
  );
}
