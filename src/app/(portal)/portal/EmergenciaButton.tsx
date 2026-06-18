"use client";

import { useActionState, useState } from "react";
import { enviarEmergencia, type PortalState } from "./actions";

interface Props {
  loteId: string | null;
}

export default function EmergenciaButton({ loteId }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [state, formAction, pending] = useActionState<PortalState, FormData>(
    enviarEmergencia,
    null,
  );

  if (state?.success) {
    return (
      <div
        style={{
          alignItems: "center",
          background: "var(--danger-bg)",
          border: "1px solid var(--danger)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "20px 16px",
          textAlign: "center",
        }}
      >
        <i
          className="ti ti-circle-check"
          style={{ color: "var(--danger)", fontSize: 36 }}
        />
        <strong style={{ color: "#ff9aa3" }}>Emergencia enviada</strong>
        <span style={{ color: "var(--text2)", fontSize: 13 }}>
          Seguridad fue alertada de inmediato
        </span>
      </div>
    );
  }

  if (confirmando) {
    return (
      <div
        style={{
          background: "var(--danger-bg)",
          border: "1px solid var(--danger)",
          borderRadius: 12,
          padding: "16px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#ff9aa3",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          ¿Confirmás la emergencia? Seguridad será alertada de inmediato.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <form action={formAction}>
            {loteId && (
              <input type="hidden" name="lote_id" value={loteId} />
            )}
            <button
              type="submit"
              className="btn btn-danger"
              disabled={pending}
              style={{ gap: 6 }}
            >
              <i className="ti ti-alert-triangle" />
              {pending ? "Enviando..." : "Sí, confirmar emergencia"}
            </button>
          </form>
          <button
            type="button"
            className="btn"
            onClick={() => setConfirmando(false)}
          >
            Cancelar
          </button>
        </div>
        {state?.error && (
          <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>
            {state.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      className="emergency-button"
      type="button"
      onClick={() => setConfirmando(true)}
    >
      <i className="ti ti-alert-triangle" aria-hidden="true" />
      <strong>EMERGENCIA</strong>
      <span>Avisa de inmediato a la garita de seguridad</span>
    </button>
  );
}
