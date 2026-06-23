"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveObra,
  cambiarEstadoObra,
  savePersonalObra,
  toggleActivoPersonal,
  type ObraState,
} from "./actions";
import { formatDate as formatDateInAppZone } from "@/lib/timezone";
import type { Lote, Obra, PersonalObra } from "@/lib/types/database";

interface ObraCompleta extends Obra {
  lote: Lote | null;
  personal_obra: PersonalObra[];
}

interface Props {
  obras: ObraCompleta[];
  lotes: Lote[];
}

const ESTADOS = [
  { value: "pendiente", label: "Pendiente", badge: "badge-gray" },
  { value: "activa", label: "Activa", badge: "badge-green" },
  { value: "finalizada", label: "Finalizada", badge: "badge-blue" },
  { value: "suspendida", label: "Suspendida", badge: "badge-red" },
];

type PersonalRow = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
};

function ObraFormContent({
  obra,
  lotes,
  onSuccess,
  onClose,
}: {
  obra?: ObraCompleta;
  lotes: Lote[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const action = obra ? saveObra.bind(null, obra.id) : saveObra.bind(null, null);
  const [state, formAction, pending] = useActionState<ObraState, FormData>(
    action,
    null,
  );
  const [personalRows, setPersonalRows] = useState<PersonalRow[]>([
    { id: 1, nombre: "", apellido: "", dni: "" },
  ]);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  function updatePersonalRow(
    rowId: number,
    field: keyof Omit<PersonalRow, "id">,
    value: string,
  ) {
    setPersonalRows((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  }

  function addPersonalRow() {
    setPersonalRows((rows) => [
      ...rows,
      { id: Date.now(), nombre: "", apellido: "", dni: "" },
    ]);
  }

  function removePersonalRow(rowId: number) {
    setPersonalRows((rows) =>
      rows.length === 1
        ? [{ ...rows[0], nombre: "", apellido: "", dni: "" }]
        : rows.filter((row) => row.id !== rowId),
    );
  }

  return (
    <form action={formAction}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>
          {obra ? "Editar obra" : "Nueva obra"}
        </h3>
        <button type="button" className="btn btn-sm" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="form-group">
        <label>Lote</label>
        <select
          name="lote_id"
          required
          defaultValue={obra?.lote_id ?? ""}
        >
          <option value="">— Seleccionar lote —</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              Lote {l.numero}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Descripción</label>
        <input
          name="descripcion"
          type="text"
          required
          placeholder="Ej: Construcción de vivienda"
          defaultValue={obra?.descripcion ?? ""}
        />
      </div>

      <div className="form-group">
        <label>Responsable de obra</label>
        <input
          name="responsable"
          type="text"
          placeholder="Nombre del responsable"
          defaultValue={obra?.responsable ?? ""}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Fecha de inicio</label>
          <input
            name="inicio"
            type="date"
            defaultValue={obra?.inicio ?? ""}
          />
        </div>
        <div className="form-group">
          <label>Fin estimado</label>
          <input
            name="fin_estimado"
            type="date"
            defaultValue={obra?.fin_estimado ?? ""}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Estado</label>
        <select name="estado" defaultValue={obra?.estado ?? "pendiente"}>
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group worker-section">
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <label style={{ marginBottom: 0 }}>Albañiles trabajando</label>
          <button
            type="button"
            className="btn btn-sm worker-add-btn"
            onClick={addPersonalRow}
            style={{ gap: 4 }}
          >
            <i className="ti ti-user-plus" /> Agregar
          </button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {personalRows.map((row, index) => (
            <div
              key={row.id}
              className="personal-row"
              style={{
                alignItems: "end",
                display: "grid",
                gap: 8,
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nombre</label>
                <input
                  name="personal_nombre"
                  type="text"
                  placeholder="Nombre"
                  value={row.nombre}
                  onChange={(e) =>
                    updatePersonalRow(row.id, "nombre", e.target.value)
                  }
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Apellido</label>
                <input
                  name="personal_apellido"
                  type="text"
                  placeholder="Apellido"
                  value={row.apellido}
                  onChange={(e) =>
                    updatePersonalRow(row.id, "apellido", e.target.value)
                  }
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>DNI</label>
                <input
                  name="personal_dni"
                  type="text"
                  inputMode="numeric"
                  placeholder="DNI"
                  value={row.dni}
                  onChange={(e) =>
                    updatePersonalRow(row.id, "dni", e.target.value)
                  }
                />
              </div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => removePersonalRow(row.id)}
                aria-label={`Quitar albañil ${index + 1}`}
                title="Quitar"
              >
                <i className="ti ti-trash" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {state?.error && (
        <div
          style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}
        >
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
          <i
            className={`ti ${obra ? "ti-device-floppy" : "ti-plus"}`}
          />
          {pending ? "Guardando..." : obra ? "Guardar cambios" : "Crear obra"}
        </button>
      </div>
    </form>
  );
}

function PersonalFormContent({
  obraId,
  onSuccess,
  onClose,
}: {
  obraId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ObraState, FormData>(
    savePersonalObra.bind(null, obraId),
    null,
  );

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Agregar personal</h3>
        <button type="button" className="btn btn-sm" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Nombre</label>
          <input name="nombre" type="text" required placeholder="Nombre" />
        </div>
        <div className="form-group">
          <label>Apellido</label>
          <input name="apellido" type="text" required placeholder="Apellido" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>DNI (opcional)</label>
          <input name="dni" type="text" placeholder="Documento" />
        </div>
        <div className="form-group" style={{ gridColumn: "span 1" }} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Horario desde</label>
          <input name="horario_inicio" type="time" defaultValue="08:00" />
        </div>
        <div className="form-group">
          <label>Horario hasta</label>
          <input name="horario_fin" type="time" defaultValue="18:00" />
        </div>
      </div>

      {state?.error && (
        <div
          style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}
        >
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
          <i className="ti ti-user-plus" />
          {pending ? "Guardando..." : "Agregar"}
        </button>
      </div>
    </form>
  );
}

function formatFecha(fecha: string | null) {
  if (!fecha) return "—";
  return formatDateInAppZone(fecha, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ObrasManager({ obras, lotes }: Props) {
  const [modal, setModal] = useState<
    | null
    | "create"
    | { edit: ObraCompleta }
    | { addPersonal: ObraCompleta }
  >(null);

  function estadoBadge(estado: string) {
    return ESTADOS.find((e) => e.value === estado)?.badge ?? "badge-gray";
  }
  function estadoLabel(estado: string) {
    return ESTADOS.find((e) => e.value === estado)?.label ?? estado;
  }

  const activas = obras.filter((o) => o.estado === "activa");

  return (
    <>
      {/* Modal */}
      <div
        className={`modal-overlay${modal ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
      >
        <div className="modal">
          {modal === "create" && (
            <ObraFormContent
              key="create"
              lotes={lotes}
              onSuccess={() => setModal(null)}
              onClose={() => setModal(null)}
            />
          )}
          {modal && typeof modal === "object" && "edit" in modal && (
            <ObraFormContent
              key={modal.edit.id}
              obra={modal.edit}
              lotes={lotes}
              onSuccess={() => setModal(null)}
              onClose={() => setModal(null)}
            />
          )}
          {modal && typeof modal === "object" && "addPersonal" in modal && (
            <PersonalFormContent
              key={`personal-${modal.addPersonal.id}`}
              obraId={modal.addPersonal.id}
              onSuccess={() => setModal(null)}
              onClose={() => setModal(null)}
            />
          )}
        </div>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">Obras</div>
          <div className="page-sub">Construcciones activas y personal autorizado</div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModal("create")}
          style={{ gap: 6 }}
        >
          <i className="ti ti-plus" /> Nueva obra
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Obras activas</div>
          <div className="stat-value">{activas.length}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Total obras</div>
          <div className="stat-value">{obras.length}</div>
        </div>
        <div className="stat amber">
          <div className="stat-label">Personal total</div>
          <div className="stat-value">
            {obras.reduce((sum, o) => sum + o.personal_obra.length, 0)}
          </div>
        </div>
      </div>

      {obras.length === 0 && (
        <div className="card">
          <div className="empty">
            <div className="empty-icon">
              <i className="ti ti-building-factory-2" />
            </div>
            Sin obras registradas
          </div>
        </div>
      )}

      {obras.map((obra) => (
        <div key={obra.id} className="card" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <div
                className="card-title"
                style={{ marginBottom: 4 }}
              >
                {obra.descripcion}
              </div>
              <div style={{ color: "var(--text2)", fontSize: 13 }}>
                {obra.lote ? `Lote ${obra.lote.numero}` : "Sin lote"}
                {obra.responsable
                  ? ` · Responsable: ${obra.responsable}`
                  : ""}
              </div>
              <div
                style={{
                  color: "var(--text3)",
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                Inicio: {formatFecha(obra.inicio)} · Fin estimado:{" "}
                {formatFecha(obra.fin_estimado)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`badge ${estadoBadge(obra.estado)}`}>
                {estadoLabel(obra.estado)}
              </span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setModal({ edit: obra })}
                style={{ gap: 4 }}
              >
                <i className="ti ti-pencil" /> Editar
              </button>
              {obra.estado === "pendiente" && (
                <form
                  action={cambiarEstadoObra.bind(null, obra.id, "activa")}
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
                    <i className="ti ti-play" /> Iniciar
                  </button>
                </form>
              )}
              {obra.estado === "activa" && (
                <form
                  action={cambiarEstadoObra.bind(
                    null,
                    obra.id,
                    "finalizada",
                  )}
                >
                  <button
                    type="submit"
                    className="btn btn-sm"
                    style={{
                      gap: 4,
                      borderColor: "var(--info)",
                      color: "#9cc4ff",
                    }}
                  >
                    <i className="ti ti-circle-check" /> Finalizar
                  </button>
                </form>
              )}
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setModal({ addPersonal: obra })}
                style={{ gap: 4 }}
              >
                <i className="ti ti-user-plus" /> Agregar personal
              </button>
            </div>
          </div>

          {obra.personal_obra.length > 0 ? (
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>DNI</th>
                    <th>Horario</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {obra.personal_obra.map((p) => (
                    <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.5 }}>
                      <td>
                        {p.apellido}, {p.nombre}
                      </td>
                      <td>{p.dni ?? "—"}</td>
                      <td>
                        {p.horario_inicio && p.horario_fin
                          ? `${p.horario_inicio} – ${p.horario_fin}`
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge ${p.activo ? "badge-green" : "badge-gray"}`}
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <form
                          action={toggleActivoPersonal.bind(
                            null,
                            p.id,
                            p.activo,
                          )}
                        >
                          <button
                            type="submit"
                            className="btn btn-sm"
                            style={{
                              gap: 4,
                              ...(p.activo
                                ? {
                                    borderColor: "var(--danger)",
                                    color: "#ff9aa3",
                                  }
                                : {
                                    borderColor: "var(--accent)",
                                    color: "var(--accent-text)",
                                  }),
                            }}
                          >
                            <i
                              className={`ti ${p.activo ? "ti-user-off" : "ti-user-check"}`}
                            />
                            {p.activo ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{ color: "var(--text3)", fontSize: 13, paddingTop: 4 }}
            >
              Sin personal registrado
            </div>
          )}
        </div>
      ))}
    </>
  );
}
