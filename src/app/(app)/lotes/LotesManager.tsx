"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  cargarLotesBonDesti,
  saveLote,
  cambiarEstadoLote,
  eliminarLote,
  type LoteState,
} from "./actions";
import type { Lote, Residente } from "@/lib/types/database";

interface LoteConResidentes extends Lote {
  residentes: Residente[];
}

interface Props {
  lotes: LoteConResidentes[];
}

const ESTADOS = [
  { value: "ocupado", label: "Ocupado", badge: "badge-green" },
  { value: "disponible", label: "Disponible", badge: "badge-gray" },
  { value: "en_obra", label: "En obra", badge: "badge-amber" },
  { value: "sin_datos", label: "Sin datos", badge: "badge-gray" },
];

function LoteFormContent({
  lote,
  onSuccess,
  onClose,
}: {
  lote?: Lote;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const action = lote
    ? saveLote.bind(null, lote.id)
    : saveLote.bind(null, null);
  const [state, formAction, pending] = useActionState<LoteState, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>
          {lote ? "Editar lote" : "Nuevo lote"}
        </h3>
        <button type="button" className="btn btn-sm" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Número de lote</label>
          <input
            name="numero"
            type="text"
            required
            placeholder="Ej: 42, A-12"
            defaultValue={lote?.numero ?? ""}
          />
        </div>
        <div className="form-group">
          <label>Estado</label>
          <select name="estado" defaultValue={lote?.estado ?? "sin_datos"}>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Observaciones (opcional)</label>
        <textarea
          name="observaciones"
          rows={3}
          placeholder="Notas sobre el lote"
          defaultValue={lote?.observaciones ?? ""}
        />
      </div>

      {state?.error && (
        <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>
          {state.error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending}
          style={{ gap: 6 }}
        >
          <i className={`ti ${lote ? "ti-device-floppy" : "ti-plus"}`} />
          {pending ? "Guardando..." : lote ? "Guardar cambios" : "Crear lote"}
        </button>
      </div>
    </form>
  );
}

export default function LotesManager({ lotes }: Props) {
  const [modal, setModal] = useState<null | "create" | { edit: LoteConResidentes }>(
    null,
  );

  function estadoBadge(estado: string) {
    return ESTADOS.find((e) => e.value === estado)?.badge ?? "badge-gray";
  }
  function estadoLabel(estado: string) {
    return ESTADOS.find((e) => e.value === estado)?.label ?? estado;
  }

  return (
    <>
      {/* Modal overlay */}
      <div
        className={`modal-overlay${modal ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
      >
        <div className="modal">
          {modal && (
            <LoteFormContent
              key={modal === "create" ? "create" : modal.edit.id}
              lote={modal === "create" ? undefined : modal.edit}
              onSuccess={() => setModal(null)}
              onClose={() => setModal(null)}
            />
          )}
        </div>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">Lotes</div>
          <div className="page-sub">Gestión de lotes y casas del barrio</div>
        </div>
        <div className="section-actions">
          <form action={cargarLotesBonDesti}>
            <button type="submit" className="btn" style={{ gap: 6 }}>
              <i className="ti ti-home-plus" /> Cargar lotes C-F
            </button>
          </form>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModal("create")}
            style={{ gap: 6 }}
          >
            <i className="ti ti-plus" /> Nuevo lote
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Total lotes</div>
          <div className="stat-value">{lotes.length}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Ocupados</div>
          <div className="stat-value">
            {lotes.filter((l) => l.estado === "ocupado").length}
          </div>
        </div>
        <div className="stat amber">
          <div className="stat-label">En obra</div>
          <div className="stat-value">
            {lotes.filter((l) => l.estado === "en_obra").length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Sin datos</div>
          <div className="stat-value">
            {lotes.filter(
              (l) => l.estado === "sin_datos" || l.estado === "disponible",
            ).length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lote</th>
                <th>Estado</th>
                <th>Residentes</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lotes.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <div className="empty-icon">
                        <i className="ti ti-home-shield" />
                      </div>
                      Sin lotes registrados
                    </div>
                  </td>
                </tr>
              ) : (
                lotes.map((lote) => (
                  <tr key={lote.id}>
                    <td>
                      <strong>Lote {lote.numero}</strong>
                    </td>
                    <td>
                      <span className={`badge ${estadoBadge(lote.estado)}`}>
                        {estadoLabel(lote.estado)}
                      </span>
                    </td>
                    <td>
                      {lote.residentes.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {lote.residentes.map((r) => (
                            <Link
                              key={r.id}
                              href={`/residentes?residente=${r.id}`}
                              className="resident-link"
                            >
                              {r.nombre} {r.apellido}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text3)" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: "var(--text2)" }}>
                      {lote.observaciones ?? "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setModal({ edit: lote })}
                          style={{ gap: 4 }}
                        >
                          <i className="ti ti-pencil" /> Editar
                        </button>

                        {/* Estado rápido */}
                        {lote.estado !== "ocupado" && (
                          <form
                            action={cambiarEstadoLote.bind(
                              null,
                              lote.id,
                              "ocupado",
                            )}
                          >
                            <button
                              type="submit"
                              className="btn btn-sm"
                              style={{
                                gap: 4,
                                borderColor: "var(--accent)",
                                color: "var(--accent-text)",
                              }}
                            >
                              <i className="ti ti-home-check" /> Ocupado
                            </button>
                          </form>
                        )}
                        {lote.estado !== "disponible" && (
                          <form
                            action={cambiarEstadoLote.bind(
                              null,
                              lote.id,
                              "disponible",
                            )}
                          >
                            <button
                              type="submit"
                              className="btn btn-sm"
                              style={{ gap: 4 }}
                            >
                              <i className="ti ti-home-off" /> Disponible
                            </button>
                          </form>
                        )}

                        {/* Eliminar (solo si sin residentes activos) */}
                        {lote.residentes.filter((r) => r.activo).length === 0 && (
                          <form
                            action={eliminarLote.bind(null, lote.id)}
                            onSubmit={(e) => {
                              if (
                                !window.confirm(
                                  `¿Eliminar Lote ${lote.numero}? Esta acción no se puede deshacer.`,
                                )
                              ) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <button
                              type="submit"
                              className="btn btn-sm btn-danger"
                              style={{ gap: 4 }}
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </form>
                        )}
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
