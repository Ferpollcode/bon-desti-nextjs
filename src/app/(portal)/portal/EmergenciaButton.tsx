"use client";

import { useActionState, useEffect, useState } from "react";
import { enviarEmergencia, type PortalState } from "./actions";
import { createClient } from "@/lib/supabase/client";

interface Props {
  loteId: string | null;
  residenteNombre: string | null;
}

export default function EmergenciaButton({ loteId, residenteNombre }: Props) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <EmergenciaForm
      key={resetKey}
      loteId={loteId}
      residenteNombre={residenteNombre}
      onReset={() => setResetKey((k) => k + 1)}
    />
  );
}

function EmergenciaForm({
  loteId,
  residenteNombre,
  onReset,
}: Props & { onReset: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const [state, formAction, pending] = useActionState<PortalState, FormData>(
    enviarEmergencia,
    null,
  );

  useEffect(() => {
    if (!state?.success) return;
    const supabase = createClient();
    const ch = supabase.channel("emergencias-garita");
    ch.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      ch.send({
        type: "broadcast",
        event: "nueva_emergencia",
        payload: { lote_id: loteId, residente_nombre: residenteNombre },
      });
      setTimeout(() => supabase.removeChannel(ch), 1000);
    });
  }, [state?.success, loteId, residenteNombre]);

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
        <button
          type="button"
          className="btn"
          onClick={onReset}
          style={{ marginTop: 4, gap: 6 }}
        >
          <i className="ti ti-alert-triangle" /> Enviar otra emergencia
        </button>
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
        <p style={{ color: "#ff9aa3", fontWeight: 700, marginBottom: 12 }}>
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
