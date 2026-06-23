"use client";

import { useActionState, useEffect, useState } from "react";
import ConfirmActionForm from "@/components/ConfirmActionForm";
import { formatDate } from "@/lib/timezone";
import type { Lote, Visitante } from "@/lib/types/database";
import { eliminarVisitante, saveVisitante, type VisitanteState } from "./actions";

interface VisitanteConLote extends Visitante {
  lote: Lote | null;
}

interface Props {
  visitantes: VisitanteConLote[];
  lotes: Lote[];
}

function formatFecha(ts: string) {
  return formatDate(ts, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function VisitanteFormContent({
  visitante,
  lotes,
  onClose,
  onSuccess,
}: {
  visitante: VisitanteConLote;
  lotes: Lote[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const action = saveVisitante.bind(null, visitante.id);
  const [state, formAction, pending] = useActionState<VisitanteState, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Editar visitante</h3>
        <button type="button" className="btn btn-sm" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Nombre</label>
          <input name="nombre" type="text" required defaultValue={visitante.nombre} />
        </div>
        <div className="form-group">
          <label>Apellido</label>
          <input name="apellido" type="text" required defaultValue={visitante.apellido} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Documento</label>
          <input name="documento" type="text" defaultValue={visitante.documento ?? ""} />
        </div>
        <div className="form-group">
          <label>Patente</label>
          <input name="patente" type="text" defaultValue={visitante.patente ?? ""} />
        </div>
      </div>

      <div className="form-group">
        <label>Lote destino</label>
        <select name="lote_id" defaultValue={visitante.lote_id ?? ""}>
          <option value="">-- Sin lote --</option>
          {lotes.map((lote) => (
            <option key={lote.id} value={lote.id}>
              Lote {lote.numero}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Observaciones</label>
        <textarea
          name="observaciones"
          rows={3}
          defaultValue={visitante.observaciones ?? ""}
        />
      </div>

      {state?.error && (
        <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>
          {state.error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onClose} disabled={pending}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending} style={{ gap: 6 }}>
          <i className="ti ti-device-floppy" />
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

export default function VisitantesManager({ visitantes, lotes }: Props) {
  const [editando, setEditando] = useState<VisitanteConLote | null>(null);

  return (
    <>
      <div
        className={`modal-overlay${editando ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setEditando(null);
        }}
      >
        <div className="modal">
          {editando && (
            <VisitanteFormContent
              key={editando.id}
              visitante={editando}
              lotes={lotes}
              onClose={() => setEditando(null)}
              onSuccess={() => setEditando(null)}
            />
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Patente</th>
                <th>Lote destino</th>
                <th>Observaciones</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visitantes.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-icon"><i className="ti ti-user-question" /></div>
                      Sin visitantes registrados
                    </div>
                  </td>
                </tr>
              ) : (
                visitantes.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.apellido}, {v.nombre}</strong></td>
                    <td>{v.documento ?? "—"}</td>
                    <td>{v.patente ?? "—"}</td>
                    <td>{v.lote ? `Lote ${v.lote.numero}` : "—"}</td>
                    <td>{v.observaciones ?? "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatFecha(v.created_at)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setEditando(v)}
                          style={{ gap: 4 }}
                        >
                          <i className="ti ti-pencil" /> Editar
                        </button>
                        <ConfirmActionForm
                          action={eliminarVisitante.bind(null, v.id)}
                          message={`¿Borrar a ${v.nombre} ${v.apellido}?`}
                        >
                          <button
                            type="submit"
                            className="btn btn-sm btn-danger"
                            style={{ gap: 4 }}
                          >
                            <i className="ti ti-trash" /> Borrar
                          </button>
                        </ConfirmActionForm>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
