"use client";

import { useActionState, useState } from "react";
import { generarPaseTemporal, type PaseTemporalState } from "./actions";
import QRDisplay from "@/components/QRDisplay";

const DIAS = [
  { id: "lun", label: "Lun" },
  { id: "mar", label: "Mar" },
  { id: "mie", label: "Mié" },
  { id: "jue", label: "Jue" },
  { id: "vie", label: "Vie" },
  { id: "sab", label: "Sáb" },
  { id: "dom", label: "Dom" },
];

interface Props {
  residenteId: string | null;
}

export default function PaseTemporalForm({ residenteId }: Props) {
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState<PaseTemporalState, FormData>(
    generarPaseTemporal,
    null,
  );

  if (state?.success && state.token) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="validation-card" style={{ textAlign: "center", padding: "16px 12px" }}>
          <i
            className="ti ti-circle-check"
            style={{ color: "var(--accent)", fontSize: 32, display: "block", marginBottom: 8 }}
          />
          <strong>Pase QR generado</strong>
          <p style={{ color: "var(--text2)", fontSize: 13, margin: "4px 0 0" }}>
            Mostrá este QR al visitante para que ingrese al barrio.
          </p>
        </div>
        <QRDisplay
          value={state.token}
          filename="pase-temporal"
          size={220}
          label="QR del visitante"
        />
        <button
          type="button"
          className="btn"
          onClick={() => setFormKey((k) => k + 1)}
          style={{ gap: 6 }}
        >
          <i className="ti ti-plus" /> Generar otro pase
        </button>
      </div>
    );
  }

  return (
    <form key={formKey} action={formAction}>
      <input type="hidden" name="residente_id" value={residenteId ?? ""} />

      <div className="form-row">
        <div className="form-group">
          <label>Nombre del visitante *</label>
          <input
            name="visitante_nombre"
            type="text"
            placeholder="Nombre y apellido"
            disabled={!residenteId}
            required
          />
        </div>
        <div className="form-group">
          <label>DNI / CUIL</label>
          <input
            name="visitante_documento"
            type="text"
            placeholder="Documento"
            disabled={!residenteId}
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
            disabled={!residenteId}
          />
        </div>
        <div className="form-group">
          <label>Motivo</label>
          <input
            name="motivo"
            type="text"
            placeholder="Visita, servicio, familiar"
            disabled={!residenteId}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Válido desde</label>
          <input name="valido_desde" type="date" disabled={!residenteId} />
        </div>
        <div className="form-group">
          <label>Válido hasta</label>
          <input name="vence_at" type="date" disabled={!residenteId} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Horario desde</label>
          <input
            name="hora_desde"
            type="time"
            defaultValue="08:00"
            disabled={!residenteId}
          />
        </div>
        <div className="form-group">
          <label>Horario hasta</label>
          <input
            name="hora_hasta"
            type="time"
            defaultValue="22:00"
            disabled={!residenteId}
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
                disabled={!residenteId}
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      {!residenteId && (
        <div className="empty" style={{ padding: "8px 0" }}>
          Seleccioná tu casa para generar pases.
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
        style={{ gap: 8, marginTop: 4 }}
      >
        <i className="ti ti-qrcode" />
        {pending ? "Generando..." : "Generar pase QR"}
      </button>
    </form>
  );
}
