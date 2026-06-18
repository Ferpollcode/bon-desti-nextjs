"use client";

import { useActionState, useState } from "react";
import { crearEmergencia, type EmergenciaState } from "./actions";
import type { Lote } from "@/lib/types/database";

interface Props {
  lotes: Lote[];
}

export default function CrearEmergencia({ lotes }: Props) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState<EmergenciaState, FormData>(
    crearEmergencia,
    null,
  );

  function handleNueva() {
    setFormKey((k) => k + 1);
  }

  return (
    <>
      <button
        className="btn btn-danger"
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ gap: 6 }}
      >
        <i className="ti ti-alert-triangle" />
        {open ? "Cerrar" : "Registrar emergencia"}
      </button>

      {open && (
        <div className="card" style={{ marginBottom: 16 }}>
          {state?.success ? (
            <div
              style={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "24px 0",
              }}
            >
              <i
                className="ti ti-alert-triangle"
                style={{ color: "var(--danger)", fontSize: 44 }}
              />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                Emergencia registrada — seguridad fue alertada
              </span>
              <button
                className="btn"
                type="button"
                onClick={handleNueva}
                style={{ gap: 6 }}
              >
                <i className="ti ti-plus" /> Registrar otra
              </button>
            </div>
          ) : (
            <form key={formKey} action={formAction}>
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Descripción de la emergencia</label>
                  <textarea
                    name="descripcion"
                    required
                    placeholder="Describí la situación de emergencia"
                    rows={3}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Lote (opcional)</label>
                <select name="lote_id">
                  <option value="">-- Sin lote específico --</option>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      Lote {l.numero}
                    </option>
                  ))}
                </select>
              </div>

              {state?.error && (
                <div
                  style={{
                    color: "var(--danger)",
                    fontSize: 13,
                    marginBottom: 10,
                  }}
                >
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-danger"
                disabled={pending}
                style={{ gap: 6 }}
              >
                <i className="ti ti-alert-triangle" />
                {pending ? "Registrando..." : "Registrar emergencia"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
