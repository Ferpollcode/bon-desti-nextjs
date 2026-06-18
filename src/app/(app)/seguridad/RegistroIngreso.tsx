"use client";

import { useActionState, useState } from "react";
import { registrarIngreso, type IngresoState } from "./actions";
import type { Residente, Lote } from "@/lib/types/database";

interface Props {
  residentes: Residente[];
  lotes: Lote[];
}

const TIPOS = [
  { value: "residente", label: "Residente" },
  { value: "visitante", label: "Visitante" },
  { value: "personal_obra", label: "Personal de obra" },
];

export default function RegistroIngreso({ residentes, lotes }: Props) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("residente");
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState<IngresoState, FormData>(
    registrarIngreso,
    null,
  );

  function handleNuevo() {
    setFormKey((k) => k + 1);
    setTipo("residente");
  }

  function handleTipo(v: string) {
    setTipo(v);
  }

  return (
    <>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ gap: 6 }}
      >
        <i className="ti ti-plus" />
        {open ? "Cerrar" : "Registrar acceso"}
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
                className="ti ti-circle-check"
                style={{ color: "var(--accent)", fontSize: 44 }}
              />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                Acceso registrado correctamente
              </span>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleNuevo}
                style={{ gap: 6 }}
              >
                <i className="ti ti-plus" /> Registrar otro
              </button>
            </div>
          ) : (
            <form key={formKey} action={formAction}>
              {/* Tipo selector */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {TIPOS.map((t) => (
                  <label
                    key={t.value}
                    style={{
                      alignItems: "center",
                      background:
                        tipo === t.value
                          ? "var(--accent-bg)"
                          : "transparent",
                      border: `1px solid ${tipo === t.value ? "var(--accent)" : "var(--border2)"}`,
                      borderRadius: 8,
                      color:
                        tipo === t.value ? "var(--accent-text)" : "var(--text2)",
                      cursor: "pointer",
                      display: "flex",
                      fontSize: 13,
                      fontWeight: tipo === t.value ? 700 : 400,
                      gap: 6,
                      padding: "6px 14px",
                    }}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={t.value}
                      checked={tipo === t.value}
                      onChange={() => handleTipo(t.value)}
                      style={{ display: "none" }}
                    />
                    {t.label}
                  </label>
                ))}
              </div>

              {/* Residente fields */}
              {tipo === "residente" && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Residente</label>
                    <select name="residente_id" required>
                      <option value="">-- Seleccionar residente --</option>
                      {residentes.map((r) => {
                        const lote = lotes.find((l) => l.id === r.lote_id);
                        return (
                          <option key={r.id} value={r.id}>
                            {r.nombre} {r.apellido}
                            {lote ? ` · Lote ${lote.numero}` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Patente (opcional)</label>
                    <input name="patente" type="text" placeholder="Ej: ABC123" />
                  </div>
                </div>
              )}

              {/* Visitante / Personal de obra fields */}
              {(tipo === "visitante" || tipo === "personal_obra") && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre</label>
                      <input
                        name="nombre"
                        type="text"
                        required
                        placeholder="Nombre"
                      />
                    </div>
                    <div className="form-group">
                      <label>Apellido</label>
                      <input
                        name="apellido"
                        type="text"
                        required
                        placeholder="Apellido"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Documento (opcional)</label>
                      <input
                        name="documento"
                        type="text"
                        placeholder="DNI / CUIL"
                      />
                    </div>
                    <div className="form-group">
                      <label>Lote destino</label>
                      <select name="lote_id">
                        <option value="">-- Seleccionar lote --</option>
                        {lotes.map((l) => (
                          <option key={l.id} value={l.id}>
                            Lote {l.numero}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Patente (opcional)</label>
                    <input
                      name="patente"
                      type="text"
                      placeholder="Ej: ABC123"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Notas (opcional)</label>
                <input
                  name="notas"
                  type="text"
                  placeholder="Observaciones adicionales"
                />
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
                className="btn btn-primary"
                disabled={pending}
                style={{ gap: 6 }}
              >
                <i className="ti ti-login-2" />
                {pending ? "Registrando..." : "Registrar ingreso"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
