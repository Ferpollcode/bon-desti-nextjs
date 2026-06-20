export type Rol = "admin" | "seguridad" | "residente" | "superadmin";

export type EstadoLote = "ocupado" | "disponible" | "en_obra" | "sin_datos";

export type TipoResidente = "propietario" | "inquilino";

export type TipoIngreso = "residente" | "visitante" | "personal_obra" | "qr";

export type EstadoEmergencia = "activa" | "en_proceso" | "resuelta" | "eliminada";

export type TipoPaseQR = "permanente" | "temporal" | "unico_uso";

export type EstadoObra = "pendiente" | "activa" | "finalizada" | "suspendida";

export interface Profile {
  id: string;
  rol: Rol;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lote {
  id: string;
  numero: string;
  estado: EstadoLote;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface Residente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  lote_id: string | null;
  tipo: TipoResidente;
  activo: boolean;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehiculo {
  id: string;
  residente_id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  activo: boolean;
  created_at: string;
}

export interface Visitante {
  id: string;
  nombre: string;
  apellido: string;
  documento: string | null;
  patente: string | null;
  lote_id: string | null;
  residente_id: string | null;
  observaciones: string | null;
  created_at: string;
}

export interface Ingreso {
  id: string;
  tipo: TipoIngreso;
  residente_id: string | null;
  visitante_id: string | null;
  lote_id: string | null;
  patente: string | null;
  notas: string | null;
  registrado_por: string | null;
  ingresado_at: string;
  egresado_at: string | null;
  created_at: string;
}

export interface Emergencia {
  id: string;
  descripcion: string;
  estado: EstadoEmergencia;
  lote_id: string | null;
  reportado_por: string | null;
  atendido_por: string | null;
  resuelto_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaseQR {
  id: string;
  residente_id: string;
  token: string;
  tipo: TipoPaseQR;
  descripcion: string | null;
  activo: boolean;
  vence_at: string | null;
  usado_at: string | null;
  created_at: string;
  // Campos para pases temporales de visitantes
  visitante_nombre: string | null;
  visitante_documento: string | null;
  visitante_telefono: string | null;
  motivo: string | null;
  valido_desde: string | null;
  hora_desde: string | null;
  hora_hasta: string | null;
  dias_habilitados: string[];
}

export interface Obra {
  id: string;
  lote_id: string;
  descripcion: string;
  responsable: string | null;
  inicio: string | null;
  fin_estimado: string | null;
  estado: EstadoObra;
  created_at: string;
  updated_at: string;
}

export interface PersonalObra {
  id: string;
  obra_id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  horario_inicio: string | null;
  horario_fin: string | null;
  activo: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  rol: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: string | null;
  valores_anteriores: Record<string, unknown> | null;
  valores_nuevos: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Comunicacion {
  id: string;
  titulo: string;
  mensaje: string;
  destinatario_tipo: "todos" | "residente";
  residente_id: string | null;
  creado_por: string | null;
  created_at: string;
}

export type EstadoReclamo = "pendiente" | "en_proceso" | "resuelto";
export type TipoReclamo = "denuncia" | "reclamo" | "sugerencia" | "consulta";
export type DestinatarioReclamo = "administracion" | "seguridad";

export interface Reclamo {
  id: string;
  residente_id: string | null;
  destinatario: DestinatarioReclamo;
  tipo: TipoReclamo;
  asunto: string;
  mensaje: string;
  estado: EstadoReclamo;
  respuesta: string | null;
  atendido_por: string | null;
  atendido_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReclamoCompleto extends Reclamo {
  residente: (Residente & { lote: Lote | null }) | null;
  atendido_por_profile: Profile | null;
}

// Tipos con joins comunes
export interface ResidenteConLote extends Residente {
  lote: Lote | null;
}

export interface IngresoCompleto extends Ingreso {
  residente: Residente | null;
  visitante: Visitante | null;
  lote: Lote | null;
  registrado_por_profile: Profile | null;
}

export interface EmergenciaCompleta extends Emergencia {
  lote: Lote | null;
  reportado_por_profile: Profile | null;
  atendido_por_profile: Profile | null;
}
