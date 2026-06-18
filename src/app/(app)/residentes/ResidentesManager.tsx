"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveResidente,
  toggleActivoResidente,
  type ResidenteState,
} from "./actions";
import {
  habilitarAccesoPortal,
  revocarAccesoPortal,
  type AccesoState,
} from "./habilitarAcceso";
import type { Lote, ResidenteConLote } from "@/lib/types/database";

interface Props {
  residentes: ResidenteConLote[];
  lotes: Lote[];
}

function ResidenteFormContent({
  residente,
  lotes,
  onSuccess,
  onClose,
}: {
  residente?: ResidenteConLote;
  lotes: Lote[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const action = residente
    ? saveResidente.bind(null, residente.id)
    : saveResidente.bind(null, null);
  const [state, formAction, pending] = useActionState<ResidenteState, FormData>(
    action,
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
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>
          {residente ? "Editar residente" : "Nuevo residente"}
        </h3>
        <button type="button" className="btn btn-sm" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Nombre</label>
          <input
            name="nombre"
            type="text"
            required
            placeholder="Nombre"
            defaultValue={residente?.nombre ?? ""}
          />
        </div>
        <div className="form-group">
          <label>Apellido</label>
          <input
            name="apellido"
            type="text"
            required
            placeholder="Apellido"
            defaultValue={residente?.apellido ?? ""}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>DNI / CUIL</label>
          <input
            name="dni"
            type="text"
            placeholder="Documento"
            defaultValue={residente?.dni ?? ""}
          />
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <input
            name="telefono"
            type="text"
            placeholder="Ej: 5492615551234"
            defaultValue={residente?.telefono ?? ""}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            defaultValue={residente?.email ?? ""}
          />
        </div>
        <div className="form-group">
          <label>Tipo</label>
          <select name="tipo" defaultValue={residente?.tipo ?? "propietario"}>
            <option value="propietario">Propietario</option>
            <option value="inquilino">Inquilino</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Lote</label>
        <select name="lote_id" defaultValue={residente?.lote_id ?? ""}>
          <option value="">— Sin lote asignado —</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              Lote {l.numero}
            </option>
          ))}
        </select>
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
            className={`ti ${residente ? "ti-device-floppy" : "ti-user-plus"}`}
          />
          {pending
            ? "Guardando..."
            : residente
              ? "Guardar cambios"
              : "Crear residente"}
        </button>
      </div>
    </form>
  );
}

function AccesoFormContent({
  residente,
  onSuccess,
  onClose,
}: {
  residente: ResidenteConLote;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<AccesoState, FormData>(
    habilitarAccesoPortal.bind(null, residente.id),
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
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Habilitar acceso portal</h3>
        <button type="button" className="btn btn-sm" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
      </div>

      <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>
        Se creará una cuenta para que{" "}
        <strong>
          {residente.nombre} {residente.apellido}
        </strong>{" "}
        pueda ingresar al portal de residentes.
      </p>

      <div className="form-group">
        <label>Usuario</label>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <input
            name="usuario"
            type="text"
            required
            placeholder="ej: jperez"
            autoCapitalize="none"
            autoCorrect="off"
            style={{ borderRadius: "8px 0 0 8px", borderRight: "none" }}
          />
          <span
            style={{
              background: "rgba(4,12,24,0.60)",
              border: "1px solid var(--border2)",
              borderLeft: "none",
              borderRadius: "0 8px 8px 0",
              color: "var(--text3)",
              fontSize: 12,
              padding: "8px 10px",
              whiteSpace: "nowrap",
            }}
          >
            @bondesti.local
          </span>
        </div>
      </div>

      <div className="form-group">
        <label>Contraseña inicial</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
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
          <i className="ti ti-key" />
          {pending ? "Creando..." : "Crear acceso"}
        </button>
      </div>
    </form>
  );
}

export default function ResidentesManager({ residentes, lotes }: Props) {
  const [modal, setModal] = useState<
    null | "create" | { edit: ResidenteConLote } | { acceso: ResidenteConLote }
  >(null);

  const activos = residentes.filter((r) => r.activo);
  const inactivos = residentes.filter((r) => !r.activo);

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
          {(modal === "create" || (modal && typeof modal === "object" && "edit" in modal)) && (
            <ResidenteFormContent
              key={modal === "create" ? "create" : (modal as { edit: ResidenteConLote }).edit.id}
              residente={modal === "create" ? undefined : (modal as { edit: ResidenteConLote }).edit}
              lotes={lotes}
              onSuccess={() => setModal(null)}
              onClose={() => setModal(null)}
            />
          )}
          {modal && typeof modal === "object" && "acceso" in modal && (
            <AccesoFormContent
              key={(modal as { acceso: ResidenteConLote }).acceso.id}
              residente={(modal as { acceso: ResidenteConLote }).acceso}
              onSuccess={() => setModal(null)}
              onClose={() => setModal(null)}
            />
          )}
        </div>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">Residentes</div>
          <div className="page-sub">Alta y gestión de personas que viven en el barrio</div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModal("create")}
          style={{ gap: 6 }}
        >
          <i className="ti ti-user-plus" /> Nuevo residente
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Total residentes</div>
          <div className="stat-value">{residentes.length}</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Activos</div>
          <div className="stat-value">{activos.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Inactivos</div>
          <div className="stat-value">{inactivos.length}</div>
        </div>
      </div>

      {/* Nuevo button + table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Lote</th>
                <th>Tipo</th>
                <th>Teléfono</th>
                <th>Portal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {residentes.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      <div className="empty-icon">
                        <i className="ti ti-users" />
                      </div>
                      Sin residentes registrados
                    </div>
                  </td>
                </tr>
              ) : (
                residentes.map((r) => (
                  <tr
                    key={r.id}
                    style={{ opacity: r.activo ? 1 : 0.5 }}
                  >
                    <td>
                      <strong>
                        {r.apellido}, {r.nombre}
                      </strong>
                    </td>
                    <td>{r.dni ?? "—"}</td>
                    <td>
                      {r.lote ? `Lote ${r.lote.numero}` : "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${r.tipo === "propietario" ? "badge-green" : "badge-blue"}`}
                      >
                        {r.tipo === "propietario" ? "Propietario" : "Inquilino"}
                      </span>
                    </td>
                    <td>{r.telefono ?? "—"}</td>
                    <td>
                      {r.profile_id ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span className="badge badge-green">
                            <i className="ti ti-circle-check" /> Habilitado
                          </span>
                          <form
                            action={revocarAccesoPortal.bind(null, r.id, r.profile_id)}
                            onSubmit={(e) => {
                              if (!window.confirm(`¿Revocar acceso portal de ${r.nombre} ${r.apellido}? Se eliminará su cuenta.`))
                                e.preventDefault();
                            }}
                          >
                            <button type="submit" className="btn btn-sm btn-danger" style={{ gap: 4 }}>
                              <i className="ti ti-user-x" /> Revocar
                            </button>
                          </form>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setModal({ acceso: r })}
                          style={{ gap: 4, borderColor: "var(--accent)", color: "var(--accent-text)" }}
                        >
                          <i className="ti ti-key" /> Habilitar
                        </button>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${r.activo ? "badge-green" : "badge-gray"}`}
                      >
                        {r.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setModal({ edit: r })}
                          style={{ gap: 4 }}
                        >
                          <i className="ti ti-pencil" /> Editar
                        </button>
                        <form
                          action={toggleActivoResidente.bind(
                            null,
                            r.id,
                            r.activo,
                          )}
                        >
                          <button
                            type="submit"
                            className="btn btn-sm"
                            style={{
                              gap: 4,
                              ...(r.activo
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
                              className={`ti ${r.activo ? "ti-user-off" : "ti-user-check"}`}
                            />
                            {r.activo ? "Desactivar" : "Activar"}
                          </button>
                        </form>
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
