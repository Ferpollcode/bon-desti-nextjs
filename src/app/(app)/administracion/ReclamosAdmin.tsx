"use client";

import { useActionState, useState } from "react";
import { actualizarReclamo } from "./actions";
import { formatDate } from "@/lib/timezone";
import type { ReclamoCompleto } from "@/lib/types/database";

interface Props {
  reclamos: ReclamoCompleto[];
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

function ReclamoRow({ reclamo }: { reclamo: ReclamoCompleto }) {
  const [expandido, setExpandido] = useState(false);
  const accion = actualizarReclamo.bind(null, reclamo.id);
  const [, formAction, pending] = useActionState(accion, null);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpandido((e) => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ fontSize: 14 }}>{reclamo.asunto}</strong>
            <span className={`badge ${estadoBadge[reclamo.estado] ?? "badge-gray"}`}>
              {estadoLabel[reclamo.estado] ?? reclamo.estado}
            </span>
            <span className="badge badge-gray">{reclamo.tipo}</span>
          </div>
          <div style={{ color: "var(--text2)", fontSize: 12, marginTop: 2 }}>
            {reclamo.residente
              ? `${reclamo.residente.nombre} ${reclamo.residente.apellido} · Lote ${reclamo.residente.lote?.numero ?? "—"}`
              : "—"}{" "}
            · {formatDate(reclamo.created_at, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
            {" · → "}
            {reclamo.destinatario}
          </div>
        </div>
        <i
          className={`ti ${expandido ? "ti-chevron-up" : "ti-chevron-down"}`}
          style={{ color: "var(--text3)" }}
        />
      </button>

      {expandido && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text1)", fontSize: 14, margin: "12px 0" }}>
            {reclamo.mensaje}
          </p>
          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Estado</label>
                <select name="estado" defaultValue={reclamo.estado}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="resuelto">Resuelto</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Respuesta (opcional)</label>
              <textarea
                name="respuesta"
                rows={3}
                defaultValue={reclamo.respuesta ?? ""}
                placeholder="Escribí una respuesta para el residente..."
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
              style={{ alignSelf: "flex-start", gap: 6 }}
            >
              <i className="ti ti-device-floppy" />
              {pending ? "Guardando..." : "Guardar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ReclamosAdmin({ reclamos }: Props) {
  const pendientes = reclamos.filter((r) => r.estado !== "resuelto");
  const resueltos = reclamos.filter((r) => r.estado === "resuelto");

  if (reclamos.length === 0) {
    return <div className="empty">Sin reclamos recibidos</div>;
  }

  return (
    <div>
      {pendientes.map((r) => (
        <ReclamoRow key={r.id} reclamo={r} />
      ))}
      {resueltos.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", color: "var(--text2)", fontSize: 13 }}>
            {resueltos.length} resuelto{resueltos.length !== 1 ? "s" : ""}
          </summary>
          <div style={{ marginTop: 8 }}>
            {resueltos.map((r) => (
              <ReclamoRow key={r.id} reclamo={r} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
