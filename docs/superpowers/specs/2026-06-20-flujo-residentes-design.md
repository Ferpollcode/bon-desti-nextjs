# Spec: Flujo completo de residentes — Bon Desti

**Fecha:** 2026-06-20  
**Scope:** Portal de residentes + Garita + Administración

---

## 1. Resumen de cambios

Cuatro áreas independientes, en orden de ejecución:

1. **Fix emergencia** — "Enviar otra" + nombre del residente en la alerta de garita
2. **Pases QR completos** — token único a 6 dígitos, QR temporal conectado, lista de pases en portal, garita valida restricciones temporales
3. **Buzón de reclamos** — portal envía, administración gestiona

La mensajería entre residentes queda fuera del scope.

---

## 2. Base de datos

### 2.1 Token único — 6 dígitos

El token de `pases_qr` tipo `unico_uso` pasa a ser un código numérico de 6 dígitos (000000–999999) generado en la Server Action, no en el DEFAULT de la DB. El campo `token` se mantiene como `text unique`. La validación de unicidad se hace con retry en la action (máx 3 intentos). Los pases tipo `temporal` mantienen el token hex actual.

### 2.2 Nuevas columnas en `pases_qr` (para pases temporales)

```sql
ALTER TABLE pases_qr
  ADD COLUMN visitante_nombre text,
  ADD COLUMN visitante_documento text,
  ADD COLUMN visitante_telefono text,
  ADD COLUMN motivo text,
  ADD COLUMN valido_desde date,
  ADD COLUMN hora_desde time,
  ADD COLUMN hora_hasta time,
  ADD COLUMN dias_habilitados text[] DEFAULT '{}';
```

Estas columnas son `null` para tokens de único uso.

### 2.3 Tabla `reclamos`

```sql
CREATE TABLE reclamos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  residente_id uuid REFERENCES residentes(id) ON DELETE SET NULL,
  destinatario text NOT NULL CHECK (destinatario IN ('administracion', 'seguridad')),
  tipo text NOT NULL CHECK (tipo IN ('denuncia', 'reclamo', 'sugerencia', 'consulta')),
  asunto text NOT NULL,
  mensaje text NOT NULL,
  estado text NOT NULL CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto')) DEFAULT 'pendiente',
  respuesta text,
  atendido_por uuid REFERENCES profiles(id) ON DELETE SET NULL,
  atendido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**RLS:**
- Residente: SELECT propio (`residente_id IN (SELECT id FROM residentes WHERE profile_id = auth.uid())`), INSERT propio
- Staff (admin/seguridad): SELECT todos, UPDATE (estado + respuesta)

---

## 3. Fix emergencia

### 3.1 Portal — "Enviar otra"

En `EmergenciaButton.tsx`, cuando `state.success === true` se muestra el estado actual (Emergencia enviada). Se agrega un botón **"Enviar otra emergencia"** que llama a `resetState` / resetea el form con `useActionState` reiniciando el componente (via key trick o llamando a la action con estado null).

`EmergenciaButton` recibe una nueva prop `residenteNombre: string | null`. Este valor se incluye en el payload del broadcast: `{ lote_id, residente_nombre }`.

### 3.2 Garita — nombre del residente en overlay

`EmergenciaAlerta.tsx`: al recibir el broadcast, `msg.payload.residente_nombre` se muestra en el overlay. Como fallback, al hacer el fetch de la última emergencia activa se agrega join a `profiles` para obtener nombre y apellido.

---

## 4. Pases QR

### 4.1 Token único — Portal

**`TokenUnicoVisita.tsx`:**
- Nuevo prop `residenteNombre` (no requerido para el token, solo para el broadcast).
- La Server Action `generarTokenUnicoVisita` genera 6 dígitos numéricos: `String(Math.floor(Math.random() * 1000000)).padStart(6, '0')`, verificando unicidad con hasta 3 reintentos.
- Tras generar, además del texto copiable se muestra una **imagen QR** usando `react-qr-code` (renderiza el token de 6 dígitos como QR). El guardia puede escanearlo o tipear el número.

### 4.2 Pase QR temporal — Portal

**Nuevo `PaseTemporalForm.tsx`** (client component):  
Conecta el formulario estático actual con una nueva Server Action `generarPaseTemporal`. Campos: `visitante_nombre` (required), `visitante_documento`, `visitante_telefono`, `motivo`, `valido_desde` (date), `vence_at` (date, campo "Válido hasta"), `hora_desde` (time), `hora_hasta` (time), `dias_habilitados` (array de strings `['lun','mar',...]`).

La action inserta en `pases_qr` con `tipo: 'temporal'` y token hex generado por el DEFAULT de la DB. Devuelve el token generado. El componente muestra un QR grande con `react-qr-code` que el residente puede mostrar en pantalla o compartir.

### 4.3 Pases generados — Portal

**Nuevo `PasesGenerados.tsx`** (server component):  
Cargado en `page.tsx`, lista los pases activos del residente en dos secciones:
- Tokens únicos: token de 6 dígitos + vencimiento + botón "Desactivar"
- Pases QR temporales: nombre del visitante + restricciones + imagen QR pequeña + botón "Desactivar"

Server Action `desactivarPase(id)`: setea `activo = false`.

### 4.4 Garita — Validación extendida para pases temporales

**`/qr/actions.ts` — `validarToken`:**  
Para pases con `tipo = 'temporal'` se validan las restricciones adicionales:
- `valido_desde`: si fecha actual < valido_desde → error "Pase no válido hasta [fecha]"
- `vence_at`: si fecha actual > vence_at → error "Pase vencido"
- `hora_desde` / `hora_hasta`: si hora actual fuera de rango → error "Pase válido solo de HH:MM a HH:MM"
- `dias_habilitados`: si el día de la semana actual no está en el array → error "Pase no válido hoy"

La respuesta `ValidacionQR` se extiende con `visitanteNombre`, `motivo`, `restricciones` (string human-readable).

**`QRScanner.tsx`:** el card de resultado muestra para pases temporales: nombre del visitante, motivo, restricciones horarias.

**`registrarIngresoQR`:** para pases temporales, al confirmar entrada se crea un `ingreso` con `tipo: 'qr'` y se popula `notas` con el nombre del visitante. El pase NO se desactiva (puede usarse múltiples veces dentro del período).

### 4.5 Paquete QR

Instalar `react-qr-code` (no requiere canvas, solo SVG, funciona en SSR/CSR).

---

## 5. Buzón de reclamos

### 5.1 Portal — Enviar

**`Reclamos.tsx`** (client component) reemplaza el bloque estático en `page.tsx`. Conecta con Server Action `enviarReclamo(residenteId, formData)`. Valida que residenteId no sea null antes de habilitar el formulario. Tras éxito muestra confirmación y limpia el form.

**`ReclamosHistorial.tsx`** (server component): muestra los últimos reclamos del residente con badge de estado (pendiente/en proceso/resuelto) y, si `respuesta` no es null, la muestra bajo el reclamo.

### 5.2 Admin — Gestionar

En `/administracion/page.tsx` se agrega una nueva sección al final: **"Buzón de reclamos"**.

**`ReclamosAdmin.tsx`** (client component): tabla con todos los reclamos, columnas: fecha, residente + lote, destinatario, tipo, asunto, estado. Al hacer click en una fila se expande con el mensaje completo y controles:
- Select de estado (pendiente → en_proceso → resuelto)
- Campo de respuesta (textarea)
- Botón "Guardar"

Server Actions: `actualizarReclamo(id, { estado, respuesta })`.

RLS: admin/seguridad pueden SELECT todos y UPDATE estado + respuesta. Residente solo puede SELECT los propios e INSERT.

---

## 6. Archivos a crear / modificar

| Archivo | Acción |
|---|---|
| `supabase/migrations/009_pases_qr_temporal.sql` | Nuevas columnas en pases_qr |
| `supabase/migrations/010_reclamos.sql` | Tabla reclamos + RLS |
| `src/app/(portal)/portal/EmergenciaButton.tsx` | + prop residenteNombre, + botón "Enviar otra", broadcast incluye nombre |
| `src/app/(portal)/portal/page.tsx` | Pasar residenteNombre a EmergenciaButton, importar PasesGenerados, PaseTemporalForm, Reclamos |
| `src/app/(portal)/portal/TokenUnicoVisita.tsx` | Mostrar QR image, token 6 dígitos |
| `src/app/(portal)/portal/PaseTemporalForm.tsx` | Nuevo — formulario temporal conectado |
| `src/app/(portal)/portal/PasesGenerados.tsx` | Nuevo — lista pases del residente |
| `src/app/(portal)/portal/Reclamos.tsx` | Nuevo — form + historial |
| `src/app/(portal)/portal/actions.ts` | + generarPaseTemporal, desactivarPase, enviarReclamo |
| `src/app/(app)/emergencias/EmergenciaAlerta.tsx` | Mostrar nombre residente |
| `src/app/(app)/qr/actions.ts` | Validar restricciones temporales, extender ValidacionQR |
| `src/app/(app)/qr/QRScanner.tsx` | Mostrar visitante + restricciones en result card |
| `src/app/(app)/administracion/page.tsx` | + sección reclamos + importar ReclamosAdmin |
| `src/app/(app)/administracion/ReclamosAdmin.tsx` | Nuevo — gestión de reclamos |
| `src/app/(app)/administracion/actions.ts` | + actualizarReclamo |
| `src/lib/types/database.ts` | + tipo Reclamo, extender PaseQR con nuevos campos |

---

## 7. Orden de implementación

1. Migraciones SQL (009, 010) — ejecutar en Supabase antes de tocar código
2. Fix emergencia (pequeño, aislado)
3. Token único 6 dígitos + QR image en portal
4. Pase QR temporal completo (form + garita)
5. Lista de pases generados en portal
6. Buzón de reclamos (portal + admin)
