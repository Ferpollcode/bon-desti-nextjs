"use client";

import { useActionState, useEffect, useState, type CSSProperties } from "react";
import {
  deleteResidente,
  saveResidente,
  toggleActivoResidente,
  type ResidenteState,
} from "./actions";
import {
  habilitarAccesoPortal,
  revocarAccesoPortal,
  type AccesoState,
} from "./habilitarAcceso";
import type { Lote, ResidenteConLote, Rol } from "@/lib/types/database";

interface Props {
  residentes: ResidenteConLote[];
  lotes: Lote[];
  rol: Rol;
  selectedResidenteId?: string;
}

const residentActionButtonStyle: CSSProperties = {
  alignItems: "center",
  columnGap: 4,
  display: "inline-grid",
  flexShrink: 0,
  gridAutoColumns: "max-content",
  gridAutoFlow: "column",
  justifyContent: "center",
  minHeight: 32,
  minWidth: 36,
  overflowWrap: "normal",
  padding: "5px 9px",
  whiteSpace: "nowrap",
  width: 36,
  wordBreak: "keep-all",
};

const residentActionButtonWideStyle: CSSProperties = {
  ...residentActionButtonStyle,
  minWidth: 128,
  width: "max-content",
};

const residentIconButtonStyle: CSSProperties = {
  ...residentActionButtonStyle,
  minWidth: 36,
  width: 36,
};

const residentActionLabelStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  minWidth: "max-content",
  overflowWrap: "normal",
  whiteSpace: "nowrap",
  wordBreak: "keep-all",
};

const residentNowrapStyle: CSSProperties = {
  overflowWrap: "normal",
  whiteSpace: "nowrap",
  wordBreak: "keep-all",
};

function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

function phoneCallHref(phone: string) {
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${phoneDigits(phone)}`;
}

function whatsappHref(phone: string) {
  const digits = phoneDigits(phone).replace(/^0+/, "");
  const internationalDigits = digits.startsWith("54") ? digits : `549${digits}`;
  return `https://wa.me/${internationalDigits}`;
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

      <div className="form-row-3">
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
        <div className="form-group">
          <label>Lote</label>
          <select name="lote_id" defaultValue={residente?.lote_id ?? ""}>
            <option value="">Sin lote</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                Lote {l.numero}
              </option>
            ))}
          </select>
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

export default function ResidentesManager({
  residentes,
  lotes,
  rol,
  selectedResidenteId,
}: Props) {
  const canManage = rol !== "seguridad";
  const [modal, setModal] = useState<
    null | "create" | { edit: ResidenteConLote } | { acceso: ResidenteConLote }
  >(null);

  const activos = residentes.filter((r) => r.activo);
  const inactivos = residentes.filter((r) => !r.activo);

  useEffect(() => {
    if (!selectedResidenteId) return;
    document
      .getElementById(`residente-${selectedResidenteId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedResidenteId]);

  if (!canManage) {
    return (
      <>
        <div className="page-header">
          <div>
            <div className="page-title">Residentes</div>
            <div className="page-sub">Consulta de personas que viven en el barrio</div>
          </div>
        </div>

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

        <div className="card">
          <div className="table-wrap">
            <table className="residentes-table" style={residentNowrapStyle}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th className="resident-col-dni">DNI</th>
                  <th className="resident-col-lote">Lote</th>
                  <th className="resident-col-type">Tipo</th>
                  <th className="resident-col-phone">Telefono</th>
                  <th>Portal</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {residentes.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
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
                      id={`residente-${r.id}`}
                      className={selectedResidenteId === r.id ? "resident-row-selected" : undefined}
                      style={{
                        opacity: r.activo ? 1 : 0.5,
                        ...residentNowrapStyle,
                      }}
                    >
                      <td style={residentNowrapStyle}>
                        <strong>
                          {r.apellido}, {r.nombre}
                        </strong>
                      </td>
                      <td className="resident-col-dni" style={residentNowrapStyle}>{r.dni ?? "-"}</td>
                      <td className="resident-col-lote" style={residentNowrapStyle}>
                        {r.lote ? `Lote ${r.lote.numero}` : "-"}
                      </td>
                      <td className="resident-col-type" style={residentNowrapStyle}>
                        <span
                          className={`badge ${r.tipo === "propietario" ? "badge-green" : "badge-blue"}`}
                        >
                          {r.tipo === "propietario" ? "Propietario" : "Inquilino"}
                        </span>
                      </td>
                      <td className="resident-col-phone" style={residentNowrapStyle}>
                        {r.telefono ? (
                          <div className="resident-phone-actions">
                            <a
                              href={phoneCallHref(r.telefono)}
                              className="resident-phone-link"
                              title="Llamar"
                            >
                              {r.telefono}
                            </a>
                            <a
                              href={whatsappHref(r.telefono)}
                              className="resident-phone-btn"
                              target="_blank"
                              rel="noreferrer"
                              title="Enviar WhatsApp"
                              aria-label={`Enviar WhatsApp a ${r.nombre} ${r.apellido}`}
                            >
                              <i className="ti ti-brand-whatsapp" />
                            </a>
                            <a
                              href={phoneCallHref(r.telefono)}
                              className="resident-phone-btn"
                              title="Llamar"
                              aria-label={`Llamar a ${r.nombre} ${r.apellido}`}
                            >
                              <i className="ti ti-phone" />
                            </a>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="resident-portal-cell" style={residentNowrapStyle}>
                        <span className={`badge ${r.profile_id ? "badge-green" : "badge-gray"}`}>
                          {r.profile_id ? "Habilitado" : "Sin acceso"}
                        </span>
                      </td>
                      <td style={residentNowrapStyle}>
                        <span
                          className={`badge ${r.activo ? "badge-green" : "badge-gray"}`}
                        >
                          {r.activo ? "Activo" : "Inactivo"}
                        </span>
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
        {canManage && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModal("create")}
            style={{ gap: 6 }}
          >
            <i className="ti ti-user-plus" /> Nuevo residente
          </button>
        )}
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
          <table className="residentes-table" style={residentNowrapStyle}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th className="resident-col-dni">DNI</th>
                <th className="resident-col-lote">Lote</th>
                <th className="resident-col-type">Tipo</th>
                <th className="resident-col-phone">Teléfono</th>
                <th>Portal</th>
                <th>Estado</th>
                {canManage && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {residentes.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7}>
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
                    id={`residente-${r.id}`}
                    className={selectedResidenteId === r.id ? "resident-row-selected" : undefined}
                    style={{
                      opacity: r.activo ? 1 : 0.5,
                      ...residentNowrapStyle,
                    }}
                  >
                    <td style={residentNowrapStyle}>
                      <strong>
                        {r.apellido}, {r.nombre}
                      </strong>
                    </td>
                    <td className="resident-col-dni" style={residentNowrapStyle}>{r.dni ?? "—"}</td>
                    <td className="resident-col-lote" style={residentNowrapStyle}>
                      {r.lote ? `Lote ${r.lote.numero}` : "—"}
                    </td>
                    <td className="resident-col-type" style={residentNowrapStyle}>
                      <span
                        className={`badge ${r.tipo === "propietario" ? "badge-green" : "badge-blue"}`}
                      >
                        {r.tipo === "propietario" ? "Propietario" : "Inquilino"}
                      </span>
                    </td>
                    <td className="resident-col-phone" style={residentNowrapStyle}>
                      {r.telefono ? (
                        <div className="resident-phone-actions">
                          <a
                            href={phoneCallHref(r.telefono)}
                            className="resident-phone-link"
                            title="Llamar"
                          >
                            {r.telefono}
                          </a>
                          <a
                            href={whatsappHref(r.telefono)}
                            className="resident-phone-btn"
                            target="_blank"
                            rel="noreferrer"
                            title="Enviar WhatsApp"
                            aria-label={`Enviar WhatsApp a ${r.nombre} ${r.apellido}`}
                          >
                            <i className="ti ti-brand-whatsapp" />
                          </a>
                          <a
                            href={phoneCallHref(r.telefono)}
                            className="resident-phone-btn"
                            title="Llamar"
                            aria-label={`Llamar a ${r.nombre} ${r.apellido}`}
                          >
                            <i className="ti ti-phone" />
                          </a>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="resident-portal-cell" style={residentNowrapStyle}>
                      {r.profile_id ? (
                        <div className="resident-portal-actions">
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
                            <button
                              type="submit"
                              className="btn btn-sm btn-danger resident-action-btn"
                              style={residentIconButtonStyle}
                              title="Revocar acceso"
                              aria-label="Revocar acceso"
                            >
                              <i className="ti ti-user-x" />
                            </button>
                          </form>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm resident-action-btn"
                          onClick={() => setModal({ acceso: r })}
                          style={{
                            ...residentIconButtonStyle,
                            borderColor: "var(--accent)",
                            color: "var(--accent-text)",
                            justifySelf: "start",
                          }}
                          title="Habilitar acceso"
                          aria-label="Habilitar acceso"
                        >
                          <i className="ti ti-key" />
                        </button>
                      )}
                    </td>
                    <td style={residentNowrapStyle}>
                      <span
                        className={`badge ${r.activo ? "badge-green" : "badge-gray"}`}
                      >
                        {r.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="resident-actions-cell" style={residentNowrapStyle}>
                      <div className="resident-row-actions">
                        <button
                          type="button"
                          className="btn btn-sm resident-action-btn"
                          onClick={() => setModal({ edit: r })}
                          style={residentIconButtonStyle}
                          title="Editar"
                          aria-label="Editar"
                        >
                          <i className="ti ti-pencil" />
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
                            className="btn btn-sm resident-action-btn"
                            style={{
                              ...residentIconButtonStyle,
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
                            title={r.activo ? "Desactivar" : "Activar"}
                            aria-label={r.activo ? "Desactivar" : "Activar"}
                          >
                            <i
                              className={`ti ${r.activo ? "ti-user-off" : "ti-user-check"}`}
                            />
                          </button>
                        </form>
                        <form
                          action={deleteResidente.bind(null, r.id, r.profile_id)}
                          onSubmit={(e) => {
                            if (!window.confirm(`¿Borrar definitivamente a ${r.nombre} ${r.apellido}? Esta acción no se puede deshacer.`))
                              e.preventDefault();
                          }}
                        >
                          <button
                            type="submit"
                            className="btn btn-sm btn-danger resident-action-btn"
                            style={residentIconButtonStyle}
                            title="Borrar"
                            aria-label="Borrar"
                          >
                            <i className="ti ti-trash" />
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
