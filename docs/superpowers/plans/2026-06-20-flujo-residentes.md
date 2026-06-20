# Flujo Completo Residentes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar el portal de residentes (emergencias, pases QR, reclamos) con backend real, y habilitar la garita para validar pases temporales de visitantes.

**Architecture:** Server Actions para toda la mutación de datos, Client Components solo donde hay interactividad (formularios, cámara, QR display). Supabase RLS protege cada operación. Broadcast de Supabase para tiempo real en emergencias.

**Tech Stack:** Next.js 16 App Router, Supabase, react-qr-code, Web Share API, canvas API para descarga de QR.

## Global Constraints

- No instalar html5-qrcode — el scanner ya usa BarcodeDetector nativo
- Tokens únicos: exactamente 6 dígitos numéricos con padding (`padStart(6, '0')`)
- Pases temporales: token hex (DEFAULT de DB), no cambiar
- RLS de reclamos: solo `admin`/`superadmin`, no `seguridad`
- Ingresos de pase temporal: `tipo: 'visitante'` con registro en tabla `visitantes`
- Ingresos de token único: `tipo: 'qr'` con `residente_id`
- Usar JWT claims (`auth.jwt() -> 'app_metadata' ->> 'rol'`) en políticas nuevas, no `get_user_rol()`

---

## File Map

| Archivo | Acción |
|---|---|
| `supabase/migrations/009_pases_qr_temporal.sql` | Crear |
| `supabase/migrations/010_reclamos.sql` | Crear |
| `src/lib/types/database.ts` | Modificar — extender PaseQR + agregar Reclamo |
| `src/app/(portal)/portal/EmergenciaButton.tsx` | Modificar |
| `src/app/(app)/emergencias/EmergenciaAlerta.tsx` | Modificar |
| `src/app/(portal)/portal/page.tsx` | Modificar |
| `src/components/QRDisplay.tsx` | Crear |
| `src/app/(portal)/portal/TokenUnicoVisita.tsx` | Modificar |
| `src/app/(portal)/portal/PaseTemporalForm.tsx` | Crear |
| `src/app/(portal)/portal/PasesGenerados.tsx` | Crear |
| `src/app/(portal)/portal/Reclamos.tsx` | Crear |
| `src/app/(portal)/portal/actions.ts` | Modificar |
| `src/app/(app)/qr/actions.ts` | Modificar |
| `src/app/(app)/qr/QRScanner.tsx` | Modificar |
| `src/app/(app)/administracion/ReclamosAdmin.tsx` | Crear |
| `src/app/(app)/administracion/actions.ts` | Crear |
| `src/app/(app)/administracion/page.tsx` | Modificar |

---

## Task 1: SQL Migrations

**Files:**
- Create: `supabase/migrations/009_pases_qr_temporal.sql`
- Create: `supabase/migrations/010_reclamos.sql`

- [ ] **Step 1: Crear migration 009**

```sql
-- supabase/migrations/009_pases_qr_temporal.sql
ALTER TABLE pases_qr
  ADD COLUMN IF NOT EXISTS visitante_nombre text,
  ADD COLUMN IF NOT EXISTS visitante_documento text,
  ADD COLUMN IF NOT EXISTS visitante_telefono text,
  ADD COLUMN IF NOT EXISTS motivo text,
  ADD COLUMN IF NOT EXISTS valido_desde date,
  ADD COLUMN IF NOT EXISTS hora_desde time,
  ADD COLUMN IF NOT EXISTS hora_hasta time,
  ADD COLUMN IF NOT EXISTS dias_habilitados text[] DEFAULT '{}';

-- Residente puede insertar pases temporales para sus lotes
CREATE POLICY "Residente crea pases temporales"
  ON pases_qr FOR INSERT TO authenticated
  WITH CHECK (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Crear migration 010**

```sql
-- supabase/migrations/010_reclamos.sql
CREATE TABLE IF NOT EXISTS reclamos (
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

ALTER TABLE reclamos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_reclamos_updated_at
  BEFORE UPDATE ON reclamos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE POLICY "Residente ve sus reclamos"
  ON reclamos FOR SELECT TO authenticated
  USING (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = (select auth.uid())
    )
  );

CREATE POLICY "Residente crea reclamos"
  ON reclamos FOR INSERT TO authenticated
  WITH CHECK (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = (select auth.uid())
    )
  );

CREATE POLICY "Admin ve todos los reclamos"
  ON reclamos FOR SELECT TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'rol'), '') IN ('admin', 'superadmin')
  );

CREATE POLICY "Admin actualiza reclamos"
  ON reclamos FOR UPDATE TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'rol'), '') IN ('admin', 'superadmin')
  )
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'rol'), '') IN ('admin', 'superadmin')
  );
```

- [ ] **Step 3: Ejecutar ambas migrations en Supabase SQL Editor**

Verificar en Table Editor que `pases_qr` tiene las nuevas columnas y que la tabla `reclamos` existe.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/009_pases_qr_temporal.sql supabase/migrations/010_reclamos.sql
git commit -m "Agrega columnas pase temporal y tabla reclamos"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types/database.ts`

- [ ] **Step 1: Extender PaseQR y agregar Reclamo**

Reemplazar la interfaz `PaseQR` existente y agregar los nuevos tipos al final del archivo:

```typescript
// Reemplazar PaseQR existente:
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

// Agregar al final del archivo:
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types/database.ts
git commit -m "Extiende tipos: PaseQR campos temporales + Reclamo"
```

---

## Task 3: Fix Emergencia — "Enviar otra" + nombre residente en garita

**Files:**
- Modify: `src/app/(portal)/portal/EmergenciaButton.tsx`
- Modify: `src/app/(portal)/portal/page.tsx`
- Modify: `src/app/(app)/emergencias/EmergenciaAlerta.tsx`

**Produces:** `EmergenciaButton` acepta `residenteNombre: string | null`. Broadcast payload incluye `residente_nombre`. Garita muestra el nombre.

- [ ] **Step 1: Reescribir EmergenciaButton.tsx**

El truco para resetear `useActionState` es envolver el contenido en un componente interno con key:

```tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { enviarEmergencia, type PortalState } from "./actions";
import { createClient } from "@/lib/supabase/client";

interface Props {
  loteId: string | null;
  residenteNombre: string | null;
}

export default function EmergenciaButton({ loteId, residenteNombre }: Props) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <EmergenciaForm
      key={resetKey}
      loteId={loteId}
      residenteNombre={residenteNombre}
      onReset={() => setResetKey((k) => k + 1)}
    />
  );
}

function EmergenciaForm({
  loteId,
  residenteNombre,
  onReset,
}: Props & { onReset: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const [state, formAction, pending] = useActionState<PortalState, FormData>(
    enviarEmergencia,
    null,
  );

  useEffect(() => {
    if (!state?.success) return;
    const supabase = createClient();
    const ch = supabase.channel("emergencias-garita");
    ch.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      ch.send({
        type: "broadcast",
        event: "nueva_emergencia",
        payload: { lote_id: loteId, residente_nombre: residenteNombre },
      });
      setTimeout(() => supabase.removeChannel(ch), 1000);
    });
  }, [state?.success, loteId, residenteNombre]);

  if (state?.success) {
    return (
      <div
        style={{
          alignItems: "center",
          background: "var(--danger-bg)",
          border: "1px solid var(--danger)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "20px 16px",
          textAlign: "center",
        }}
      >
        <i className="ti ti-circle-check" style={{ color: "var(--danger)", fontSize: 36 }} />
        <strong style={{ color: "#ff9aa3" }}>Emergencia enviada</strong>
        <span style={{ color: "var(--text2)", fontSize: 13 }}>
          Seguridad fue alertada de inmediato
        </span>
        <button
          type="button"
          className="btn"
          onClick={onReset}
          style={{ marginTop: 4, gap: 6 }}
        >
          <i className="ti ti-alert-triangle" /> Enviar otra emergencia
        </button>
      </div>
    );
  }

  if (confirmando) {
    return (
      <div
        style={{
          background: "var(--danger-bg)",
          border: "1px solid var(--danger)",
          borderRadius: 12,
          padding: "16px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#ff9aa3", fontWeight: 700, marginBottom: 12 }}>
          ¿Confirmás la emergencia? Seguridad será alertada de inmediato.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <form action={formAction}>
            {loteId && <input type="hidden" name="lote_id" value={loteId} />}
            <button
              type="submit"
              className="btn btn-danger"
              disabled={pending}
              style={{ gap: 6 }}
            >
              <i className="ti ti-alert-triangle" />
              {pending ? "Enviando..." : "Sí, confirmar emergencia"}
            </button>
          </form>
          <button type="button" className="btn" onClick={() => setConfirmando(false)}>
            Cancelar
          </button>
        </div>
        {state?.error && (
          <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>
            {state.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      className="emergency-button"
      type="button"
      onClick={() => setConfirmando(true)}
    >
      <i className="ti ti-alert-triangle" aria-hidden="true" />
      <strong>EMERGENCIA</strong>
      <span>Avisa de inmediato a la garita de seguridad</span>
    </button>
  );
}
```

- [ ] **Step 2: Actualizar page.tsx — pasar residenteNombre a EmergenciaButton**

Buscar la línea con `<EmergenciaButton loteId={selectedLoteId ?? null} />` y reemplazarla:

```tsx
<EmergenciaButton
  loteId={selectedLoteId ?? null}
  residenteNombre={
    selectedResidente
      ? `${selectedResidente.nombre} ${selectedResidente.apellido}`
      : null
  }
/>
```

- [ ] **Step 3: Actualizar EmergenciaAlerta.tsx — mostrar nombre residente**

Reemplazar el bloque `.on("broadcast", ...)` con:

```tsx
.on("broadcast", { event: "nueva_emergencia" }, async (msg) => {
  const lote_id = msg.payload?.lote_id as string | null | undefined;
  const nombrePayload = msg.payload?.residente_nombre as string | null | undefined;
  let lote_numero: string | null = null;

  if (lote_id) {
    const { data } = await supabase
      .from("lotes")
      .select("numero")
      .eq("id", lote_id)
      .single();
    lote_numero = data?.numero ?? null;
  }

  const { data: emergencia } = await supabase
    .from("emergencias")
    .select("descripcion, reportado_por_profile:profiles(nombre, apellido)")
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const perfil = emergencia?.reportado_por_profile as { nombre: string | null; apellido: string | null } | null;
  const nombreDB = perfil ? `${perfil.nombre ?? ""} ${perfil.apellido ?? ""}`.trim() : null;

  setAlerta({
    descripcion: emergencia?.descripcion ?? "Emergencia reportada desde el portal",
    lote_numero,
    residente_nombre: nombrePayload ?? nombreDB ?? null,
  });
  playAlarm();
})
```

Actualizar la interfaz `AlertaActiva` en EmergenciaAlerta.tsx:

```tsx
interface AlertaActiva {
  descripcion: string;
  lote_numero: string | null;
  residente_nombre: string | null;
}
```

Y en el JSX del overlay, agregar debajo de `{alerta.lote_numero && ...}`:

```tsx
{alerta.residente_nombre && (
  <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 0 }}>
    Reportado por: <strong style={{ color: "#fff" }}>{alerta.residente_nombre}</strong>
  </p>
)}
```

- [ ] **Step 4: Verificar en browser**

Abrir portal residente en una pestaña y garita en otra. Confirmar emergencia → el overlay de garita debe mostrar el nombre del residente. Presionar "Enviar otra emergencia" → el formulario se resetea y se puede confirmar una segunda vez.

- [ ] **Step 5: Commit**

```bash
git add src/app/(portal)/portal/EmergenciaButton.tsx src/app/(portal)/portal/page.tsx src/app/(app)/emergencias/EmergenciaAlerta.tsx
git commit -m "Emergencia: boton enviar otra + nombre residente en alerta garita"
```

---

## Task 4: Componente QRDisplay reutilizable + instalar react-qr-code

**Files:**
- Create: `src/components/QRDisplay.tsx`

**Produces:** `<QRDisplay value={token} filename="pase-qr" size={200} />` — renderiza QR SVG con botones de descarga y compartir.

- [ ] **Step 1: Instalar react-qr-code**

```bash
npm install react-qr-code
```

- [ ] **Step 2: Crear src/components/QRDisplay.tsx**

```tsx
"use client";

import QRCode from "react-qr-code";
import { useRef } from "react";

interface Props {
  value: string;
  filename?: string;
  size?: number;
  label?: string;
}

export default function QRDisplay({ value, filename = "pase-qr", size = 200, label }: Props) {
  const qrId = `qr-${value.replace(/\W/g, "")}`;

  function descargar() {
    const svgEl = document.getElementById(qrId);
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `${filename}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }

  async function compartir() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: label ?? "Pase QR", text: `Código: ${value}` });
    } catch {
      // usuario canceló
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {label && <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text2)" }}>{label}</span>}
      <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
        <QRCode id={qrId} value={value} size={size} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn btn-sm" onClick={descargar} style={{ gap: 4 }}>
          <i className="ti ti-download" /> Descargar
        </button>
        {"share" in navigator && (
          <button type="button" className="btn btn-sm" onClick={compartir} style={{ gap: 4 }}>
            <i className="ti ti-share" /> Compartir
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar compilación**

```bash
npx tsc --noEmit
```

Sin errores de tipos.

- [ ] **Step 4: Commit**

```bash
git add src/components/QRDisplay.tsx package.json package-lock.json
git commit -m "Agrega componente QRDisplay con descarga y share"
```

---

## Task 5: Token único — 6 dígitos + mostrar QR

**Files:**
- Modify: `src/app/(portal)/portal/actions.ts` — `generarTokenUnicoVisita`
- Modify: `src/app/(portal)/portal/TokenUnicoVisita.tsx`

- [ ] **Step 1: Actualizar generarTokenUnicoVisita en actions.ts**

Reemplazar la función completa:

```typescript
export async function generarTokenUnicoVisita(
  _prev: TokenUnicoState,
  formData: FormData,
): Promise<TokenUnicoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const residente_id = (formData.get("residente_id") as string) || null;
  const visitante = (formData.get("visitante") as string)?.trim();
  const documento = (formData.get("documento") as string)?.trim() || null;
  const vence_at = (formData.get("vence_at") as string) || null;

  if (!residente_id) return { error: "Seleccioná tu casa antes de generar el token" };
  if (!visitante) return { error: "El nombre del visitante es requerido" };

  const { data: residente } = await supabase
    .from("residentes")
    .select("id")
    .eq("id", residente_id)
    .eq("profile_id", user.id)
    .eq("activo", true)
    .single();
  if (!residente) return { error: "No tenés permiso para generar pases en esa casa" };

  // Generar token de 6 dígitos único entre pases activos
  let token: string | null = null;
  for (let i = 0; i < 3; i++) {
    const candidato = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    const { count } = await supabase
      .from("pases_qr")
      .select("*", { count: "exact", head: true })
      .eq("token", candidato)
      .eq("activo", true);
    if ((count ?? 1) === 0) { token = candidato; break; }
  }
  if (!token) return { error: "No se pudo generar un token único, intentá de nuevo" };

  const descripcion = documento
    ? `Visita: ${visitante} - DNI ${documento}`
    : `Visita: ${visitante}`;

  const { data, error } = await supabase
    .from("pases_qr")
    .insert({
      residente_id,
      tipo: "unico_uso",
      descripcion,
      token,
      visitante_nombre: visitante,
      visitante_documento: documento,
      vence_at,
      activo: true,
    })
    .select("token, vence_at")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal");
  return { success: true, token: data?.token, vence_at: data?.vence_at ?? null };
}
```

- [ ] **Step 2: Actualizar TokenUnicoVisita.tsx — agregar QR display**

Agregar import al inicio:

```tsx
import QRDisplay from "@/components/QRDisplay";
```

Reemplazar el bloque `{state?.token && (...)}` con:

```tsx
{state?.token && (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
    <div className="token-result">
      <div>
        <span>Token generado</span>
        <strong style={{ fontSize: 24, letterSpacing: 4 }}>{state.token}</strong>
      </div>
      <button
        type="button"
        className="btn btn-sm"
        onClick={copyToken}
        style={{ gap: 6 }}
      >
        <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
    <QRDisplay
      value={state.token}
      filename={`token-visita-${state.token}`}
      size={180}
      label="Mostrar o compartir al visitante"
    />
    {state.vence_at && (
      <p style={{ color: "var(--text3)", fontSize: 12, textAlign: "center" }}>
        Vence: {new Date(state.vence_at).toLocaleDateString("es-AR")}
      </p>
    )}
  </div>
)}
```

- [ ] **Step 3: Verificar en browser**

Portal → seleccionar casa → completar nombre del visitante → Generar token. Verificar que:
- El token tiene 6 dígitos
- Aparece la imagen QR
- El botón "Descargar" genera un PNG
- En móvil aparece el botón "Compartir"

- [ ] **Step 4: Commit**

```bash
git add src/app/(portal)/portal/actions.ts src/app/(portal)/portal/TokenUnicoVisita.tsx
git commit -m "Token unico: 6 digitos numericos + imagen QR descargable"
```

---

## Task 6: Pase QR Temporal — formulario conectado

**Files:**
- Create: `src/app/(portal)/portal/PaseTemporalForm.tsx`
- Modify: `src/app/(portal)/portal/actions.ts` — agregar `generarPaseTemporal`
- Modify: `src/app/(portal)/portal/page.tsx`

**Interfaces:**
- Consumes: `residenteId: string | null` como prop
- Produces: Server Action `generarPaseTemporal(prev, formData): Promise<PaseTemporalState>`

- [ ] **Step 1: Agregar generarPaseTemporal a actions.ts**

Agregar al final de `src/app/(portal)/portal/actions.ts`:

```typescript
export type PaseTemporalState = {
  error?: string;
  success?: boolean;
  token?: string;
} | null;

export async function generarPaseTemporal(
  _prev: PaseTemporalState,
  formData: FormData,
): Promise<PaseTemporalState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const residente_id = formData.get("residente_id") as string;
  if (!residente_id) return { error: "Seleccioná tu casa primero" };

  const { data: residente } = await supabase
    .from("residentes")
    .select("id")
    .eq("id", residente_id)
    .eq("profile_id", user.id)
    .eq("activo", true)
    .single();
  if (!residente) return { error: "No tenés permiso para generar pases en esa casa" };

  const visitante_nombre = (formData.get("visitante_nombre") as string)?.trim();
  if (!visitante_nombre) return { error: "El nombre del visitante es requerido" };

  const visitante_documento = (formData.get("visitante_documento") as string)?.trim() || null;
  const visitante_telefono = (formData.get("visitante_telefono") as string)?.trim() || null;
  const motivo = (formData.get("motivo") as string)?.trim() || null;
  const valido_desde = (formData.get("valido_desde") as string) || null;
  const vence_hasta = (formData.get("vence_at") as string) || null;
  const hora_desde = (formData.get("hora_desde") as string) || null;
  const hora_hasta = (formData.get("hora_hasta") as string) || null;
  const dias = formData.getAll("dias_habilitados") as string[];

  const { data, error } = await supabase
    .from("pases_qr")
    .insert({
      residente_id,
      tipo: "temporal",
      descripcion: `Visita: ${visitante_nombre}`,
      visitante_nombre,
      visitante_documento,
      visitante_telefono,
      motivo,
      valido_desde: valido_desde || null,
      vence_at: vence_hasta ? new Date(vence_hasta + "T23:59:59").toISOString() : null,
      hora_desde: hora_desde || null,
      hora_hasta: hora_hasta || null,
      dias_habilitados: dias,
      activo: true,
    })
    .select("token")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal");
  return { success: true, token: data?.token };
}

export async function desactivarPase(
  _prev: null,
  formData: FormData,
): Promise<null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const id = formData.get("id") as string;

  const { data: pase } = await supabase
    .from("pases_qr")
    .select("residente_id, residente:residentes(profile_id)")
    .eq("id", id)
    .single();

  if (!pase) return null;
  const perfil = pase.residente as { profile_id: string | null } | null;
  if (perfil?.profile_id !== user.id) return null;

  await supabase.from("pases_qr").update({ activo: false }).eq("id", id);
  revalidatePath("/portal");
  return null;
}
```

- [ ] **Step 2: Crear PaseTemporalForm.tsx**

```tsx
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
          <i className="ti ti-circle-check" style={{ color: "var(--accent)", fontSize: 32, display: "block", marginBottom: 8 }} />
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
          <input name="visitante_nombre" type="text" placeholder="Nombre y apellido" disabled={!residenteId} required />
        </div>
        <div className="form-group">
          <label>DNI / CUIL</label>
          <input name="visitante_documento" type="text" placeholder="Documento" disabled={!residenteId} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Teléfono / WhatsApp</label>
          <input name="visitante_telefono" type="text" placeholder="Ej: 5492615551234" disabled={!residenteId} />
        </div>
        <div className="form-group">
          <label>Motivo</label>
          <input name="motivo" type="text" placeholder="Visita, servicio, familiar" disabled={!residenteId} />
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
          <input name="hora_desde" type="time" defaultValue="08:00" disabled={!residenteId} />
        </div>
        <div className="form-group">
          <label>Horario hasta</label>
          <input name="hora_hasta" type="time" defaultValue="22:00" disabled={!residenteId} />
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
```

- [ ] **Step 3: Actualizar page.tsx — reemplazar sección Pases temporales**

Agregar import:
```tsx
import PaseTemporalForm from "./PaseTemporalForm";
```

Buscar la sección `{/* Pases temporales para visitantes */}` en page.tsx. Reemplazar el bloque estático del formulario "Generar pase QR" (desde el `<div className="divider" />` que hay entre TokenUnicoVisita y los campos manuales hasta el botón "Generar pase QR") con:

```tsx
<div className="divider" />
<div className="owner-section-title">Pase QR temporal</div>
<p className="owner-card-subtitle">
  Para visitas recurrentes: el visitante muestra el QR en la garita.
</p>
<PaseTemporalForm residenteId={selectedResidente?.id ?? null} />
```

Eliminar los campos manuales estáticos (visitante_nombre, DNI/CUIL, teléfono, motivo, fechas, horarios, días, botón "Generar pase QR") que estaban ahí.

- [ ] **Step 4: Verificar en browser**

Portal → seleccionar casa → completar formulario de pase temporal → Generar. Verificar que aparece el QR y los botones de descarga/compartir. Verificar en Supabase Table Editor que se creó el pase con los campos correctos.

- [ ] **Step 5: Commit**

```bash
git add src/app/(portal)/portal/PaseTemporalForm.tsx src/app/(portal)/portal/actions.ts src/app/(portal)/portal/page.tsx
git commit -m "Pase QR temporal: formulario conectado con descarga QR"
```

---

## Task 7: Pases generados en portal

**Files:**
- Create: `src/app/(portal)/portal/PasesGenerados.tsx`
- Modify: `src/app/(portal)/portal/page.tsx`

**Interfaces:**
- Consumes: `residenteId: string | null`
- Consumes: `desactivarPase` de `./actions`

- [ ] **Step 1: Crear PasesGenerados.tsx**

```tsx
import { createClient } from "@/lib/supabase/server";
import type { PaseQR } from "@/lib/types/database";
import QRDisplay from "@/components/QRDisplay";
import { desactivarPase } from "./actions";

interface Props {
  residenteId: string | null;
}

async function getPases(residenteId: string): Promise<PaseQR[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pases_qr")
    .select("*")
    .eq("residente_id", residenteId)
    .eq("activo", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as PaseQR[];
}

function formatFecha(ts: string) {
  return new Date(ts).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function PasesGenerados({ residenteId }: Props) {
  if (!residenteId) return null;

  const pases = await getPases(residenteId);
  const unicos = pases.filter((p) => p.tipo === "unico_uso");
  const temporales = pases.filter((p) => p.tipo === "temporal");

  if (pases.length === 0) {
    return (
      <div className="empty" style={{ padding: "16px 0 8px" }}>
        Todavía no hay pases activos.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {unicos.length > 0 && (
        <div>
          <div className="owner-section-title" style={{ marginBottom: 8 }}>Tokens de único uso activos</div>
          {unicos.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "12px",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: 3 }}>{p.token}</div>
                <div style={{ color: "var(--text2)", fontSize: 12 }}>
                  {p.visitante_nombre ?? p.descripcion ?? "—"}
                  {p.vence_at && ` · Vence ${formatFecha(p.vence_at)}`}
                </div>
              </div>
              <form action={desactivarPase}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="btn btn-sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
                  Desactivar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {temporales.length > 0 && (
        <div>
          <div className="owner-section-title" style={{ marginBottom: 8 }}>Pases QR temporales activos</div>
          {temporales.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "12px",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.visitante_nombre ?? "—"}</div>
                  <div style={{ color: "var(--text2)", fontSize: 12 }}>
                    {p.motivo && `${p.motivo} · `}
                    {p.valido_desde && `Desde ${formatFecha(p.valido_desde)} `}
                    {p.vence_at && `hasta ${formatFecha(p.vence_at)}`}
                  </div>
                  {p.hora_desde && p.hora_hasta && (
                    <div style={{ color: "var(--text3)", fontSize: 11 }}>
                      {p.hora_desde} – {p.hora_hasta}
                      {p.dias_habilitados?.length > 0 && ` · ${p.dias_habilitados.join(", ")}`}
                    </div>
                  )}
                </div>
                <form action={desactivarPase}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="btn btn-sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
                    Desactivar
                  </button>
                </form>
              </div>
              <QRDisplay value={p.token} filename={`pase-${p.visitante_nombre ?? p.id}`} size={140} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Actualizar page.tsx — importar y usar PasesGenerados**

Agregar import:
```tsx
import PasesGenerados from "./PasesGenerados";
```

Buscar `<div className="owner-section-title">Pases generados</div>` y el `<div className="empty">` que le sigue. Reemplazarlos con:

```tsx
<div className="divider" />
<div className="owner-section-title">Pases generados</div>
<PasesGenerados residenteId={selectedResidente?.id ?? null} />
```

- [ ] **Step 3: Verificar en browser**

Generar un token único y un pase temporal desde el portal. Verificar que aparecen en la sección "Pases generados". Verificar que el botón "Desactivar" los elimina de la lista.

- [ ] **Step 4: Commit**

```bash
git add src/app/(portal)/portal/PasesGenerados.tsx src/app/(portal)/portal/page.tsx
git commit -m "Portal: lista de pases activos con QR y boton desactivar"
```

---

## Task 8: Garita — Validar restricciones temporales + ingreso visitante

**Files:**
- Modify: `src/app/(app)/qr/actions.ts`
- Modify: `src/app/(app)/qr/QRScanner.tsx`

- [ ] **Step 1: Reescribir src/app/(app)/qr/actions.ts**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Residente, Lote, PaseQR } from "@/lib/types/database";

export interface ValidacionQR {
  error?: string;
  pase?: PaseQR & { residente: (Residente & { lote: Lote | null }) | null };
  yaAdentro?: boolean;
  restricciones?: string;
}

const DIAS_MAP: Record<string, number> = {
  dom: 0, lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6,
};

function validarRestricciones(pase: PaseQR): string | null {
  const ahora = new Date();

  if (pase.valido_desde) {
    const desde = new Date(pase.valido_desde + "T00:00:00");
    if (ahora < desde) {
      return `No válido hasta ${desde.toLocaleDateString("es-AR")}`;
    }
  }

  if (pase.vence_at && new Date(pase.vence_at) < ahora) {
    return "Pase vencido";
  }

  if (pase.dias_habilitados?.length > 0) {
    const diaHoy = ahora.getDay();
    const diasValidos = pase.dias_habilitados.map((d) => DIAS_MAP[d] ?? -1);
    if (!diasValidos.includes(diaHoy)) {
      return `No válido hoy (días: ${pase.dias_habilitados.join(", ")})`;
    }
  }

  if (pase.hora_desde && pase.hora_hasta) {
    const horaHoy = ahora.toTimeString().slice(0, 5);
    if (horaHoy < pase.hora_desde || horaHoy > pase.hora_hasta) {
      return `Válido solo de ${pase.hora_desde} a ${pase.hora_hasta}`;
    }
  }

  return null;
}

export async function validarToken(token: string): Promise<ValidacionQR> {
  if (!token?.trim()) return { error: "Token vacío" };
  const supabase = await createClient();

  const { data: pase } = await supabase
    .from("pases_qr")
    .select("*, residente:residentes(*, lote:lotes(*))")
    .eq("token", token.trim())
    .single();

  if (!pase) return { error: "QR no encontrado o inválido" };
  if (!pase.activo) return { error: "Este QR está desactivado" };

  // Validar restricciones temporales para pases de visitante
  if (pase.tipo === "temporal") {
    const errorRestricciones = validarRestricciones(pase as PaseQR);
    if (errorRestricciones) return { error: errorRestricciones };

    // Verificar si hay visitante ya adentro en ese lote
    const lote_id = (pase.residente as Residente & { lote: Lote | null } | null)?.lote_id;
    if (lote_id) {
      const { count } = await supabase
        .from("ingresos")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "visitante")
        .eq("lote_id", lote_id)
        .is("egresado_at", null);
      if ((count ?? 0) > 0) {
        return { pase: pase as ValidacionQR["pase"], yaAdentro: true };
      }
    }

    const restricciones = [
      pase.hora_desde && pase.hora_hasta ? `${pase.hora_desde}–${pase.hora_hasta}` : null,
      (pase as PaseQR).dias_habilitados?.length > 0
        ? (pase as PaseQR).dias_habilitados.join(", ")
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return { pase: pase as ValidacionQR["pase"], restricciones: restricciones || undefined };
  }

  // Token único: validar vencimiento
  if (pase.vence_at && new Date(pase.vence_at) < new Date()) {
    return { error: "Este token está vencido" };
  }

  // Verificar si el residente ya está adentro
  if (pase.residente_id) {
    const { count } = await supabase
      .from("ingresos")
      .select("*", { count: "exact", head: true })
      .eq("residente_id", pase.residente_id)
      .is("egresado_at", null);
    if ((count ?? 0) > 0) return { pase: pase as ValidacionQR["pase"], yaAdentro: true };
  }

  return { pase: pase as ValidacionQR["pase"] };
}

export async function registrarIngresoQR(
  paseId: string,
  esEgreso: boolean,
  _formData: FormData,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: pase } = await supabase
    .from("pases_qr")
    .select("*, residente:residentes(*, lote:lotes(*))")
    .eq("id", paseId)
    .single();

  if (!pase) return;

  const residente = pase.residente as (Residente & { lote: Lote | null }) | null;
  const lote_id = residente?.lote_id ?? null;

  if (esEgreso) {
    if (pase.tipo === "temporal") {
      const { data: ingresoAbierto } = await supabase
        .from("ingresos")
        .select("id")
        .eq("tipo", "visitante")
        .eq("lote_id", lote_id ?? "")
        .is("egresado_at", null)
        .order("ingresado_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ingresoAbierto) {
        await supabase
          .from("ingresos")
          .update({ egresado_at: new Date().toISOString() })
          .eq("id", ingresoAbierto.id);
      }
    } else {
      await supabase
        .from("ingresos")
        .update({ egresado_at: new Date().toISOString() })
        .eq("residente_id", pase.residente_id)
        .is("egresado_at", null);
    }
  } else {
    if (pase.tipo === "temporal") {
      // Crear o reutilizar visitante
      const nombre = (pase as PaseQR).visitante_nombre ?? "Visitante";
      const partes = nombre.split(" ");
      const visitanteNombre = partes[0];
      const visitanteApellido = partes.slice(1).join(" ") || "-";
      const documento = (pase as PaseQR).visitante_documento;

      let visitante_id: string | null = null;

      if (documento) {
        const { data: existing } = await supabase
          .from("visitantes")
          .select("id")
          .eq("documento", documento)
          .maybeSingle();
        visitante_id = existing?.id ?? null;
      }

      if (!visitante_id) {
        const { data: nuevo } = await supabase
          .from("visitantes")
          .insert({
            nombre: visitanteNombre,
            apellido: visitanteApellido,
            documento: documento ?? null,
            lote_id,
          })
          .select("id")
          .single();
        visitante_id = nuevo?.id ?? null;
      }

      await supabase.from("ingresos").insert({
        tipo: "visitante",
        visitante_id,
        lote_id,
        registrado_por: user.id,
        notas: (pase as PaseQR).motivo ?? null,
      });
    } else {
      // Token único — ingreso del residente
      await supabase.from("ingresos").insert({
        tipo: "qr",
        residente_id: pase.residente_id,
        lote_id,
        registrado_por: user.id,
      });

      if (pase.tipo === "unico_uso") {
        await supabase
          .from("pases_qr")
          .update({ activo: false, usado_at: new Date().toISOString() })
          .eq("id", paseId);
      }
    }
  }

  revalidatePath("/qr");
  revalidatePath("/seguridad");
}
```

- [ ] **Step 2: Actualizar QRScanner.tsx — mostrar info visitante y restricciones**

En el card de resultado (dentro de `{pase && !resultado?.error && !isPending && !registrado && ...}`), reemplazar el bloque del grid de info con:

```tsx
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16, fontSize: 13 }}>
  <div>
    <span style={{ color: "var(--text3)" }}>Tipo de pase</span>
    <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
      {pase.tipo === "unico_uso" ? "Token único" : pase.tipo === "temporal" ? "Temporal" : pase.tipo}
    </div>
  </div>
  <div>
    <span style={{ color: "var(--text3)" }}>Estado</span>
    <div style={{ fontWeight: 600 }}>
      {resultado.yaAdentro ? (
        <span style={{ color: "var(--warn)" }}>Ya está adentro</span>
      ) : (
        <span style={{ color: "var(--accent)" }}>Listo para ingresar</span>
      )}
    </div>
  </div>
  {pase.tipo === "temporal" && pase.visitante_nombre && (
    <div style={{ gridColumn: "1 / -1" }}>
      <span style={{ color: "var(--text3)" }}>Visitante</span>
      <div style={{ fontWeight: 600 }}>{pase.visitante_nombre}</div>
      {pase.motivo && <div style={{ color: "var(--text2)", fontSize: 12 }}>{pase.motivo}</div>}
    </div>
  )}
  {resultado.restricciones && (
    <div style={{ gridColumn: "1 / -1" }}>
      <span style={{ color: "var(--text3)" }}>Horario / días</span>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{resultado.restricciones}</div>
    </div>
  )}
</div>
```

También actualizar la cabecera del card para mostrar visitante en pases temporales:

```tsx
<div style={{ fontWeight: 800, fontSize: 18 }}>
  {pase.tipo === "temporal" && pase.visitante_nombre
    ? pase.visitante_nombre
    : residente
      ? `${residente.nombre} ${residente.apellido}`
      : "Residente"}
</div>
{pase.tipo === "temporal"
  ? residente && (
      <div style={{ color: "var(--text2)", fontSize: 13 }}>
        Visita a Lote {residente.lote?.numero ?? "—"}
      </div>
    )
  : residente?.lote && (
      <div style={{ color: "var(--text2)", fontSize: 13 }}>
        Lote {residente.lote.numero}
      </div>
    )}
```

- [ ] **Step 3: Verificar en browser**

Garita: escanear un token de 6 dígitos → debe mostrar nombre del residente y confirmar ingreso como `tipo: 'qr'`. Escanear un token de pase temporal → debe mostrar nombre del visitante, restricciones, y confirmar ingreso como `tipo: 'visitante'`. Verificar en Supabase que se creó el visitante y el ingreso correctamente.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/qr/actions.ts src/app/(app)/qr/QRScanner.tsx
git commit -m "Garita: valida restricciones temporales, ingreso visitante separado de residente"
```

---

## Task 9: Buzón de Reclamos — Portal

**Files:**
- Create: `src/app/(portal)/portal/Reclamos.tsx`
- Modify: `src/app/(portal)/portal/actions.ts` — agregar `enviarReclamo`
- Modify: `src/app/(portal)/portal/page.tsx`

- [ ] **Step 1: Agregar enviarReclamo a actions.ts**

```typescript
export type ReclamoState = { error?: string; success?: boolean } | null;

export async function enviarReclamo(
  _prev: ReclamoState,
  formData: FormData,
): Promise<ReclamoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const residente_id = formData.get("residente_id") as string;
  if (!residente_id) return { error: "Seleccioná tu casa primero" };

  const { data: residente } = await supabase
    .from("residentes")
    .select("id")
    .eq("id", residente_id)
    .eq("profile_id", user.id)
    .eq("activo", true)
    .single();
  if (!residente) return { error: "No tenés permiso para enviar reclamos desde esa casa" };

  const destinatario = formData.get("destinatario") as string;
  const tipo = formData.get("tipo") as string;
  const asunto = (formData.get("asunto") as string)?.trim();
  const mensaje = (formData.get("mensaje") as string)?.trim();

  if (!asunto) return { error: "El asunto es requerido" };
  if (!mensaje) return { error: "El mensaje es requerido" };

  const { error } = await supabase.from("reclamos").insert({
    residente_id,
    destinatario,
    tipo,
    asunto,
    mensaje,
  });

  if (error) return { error: error.message };

  revalidatePath("/portal");
  return { success: true };
}
```

- [ ] **Step 2: Crear Reclamos.tsx**

```tsx
"use client";

import { useActionState, useState } from "react";
import { enviarReclamo, type ReclamoState } from "./actions";
import type { Reclamo } from "@/lib/types/database";

interface Props {
  residenteId: string | null;
  reclamos: Reclamo[];
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

export default function Reclamos({ residenteId, reclamos }: Props) {
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState<ReclamoState, FormData>(
    enviarReclamo,
    null,
  );

  return (
    <div>
      {state?.success ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <i className="ti ti-circle-check" style={{ color: "var(--accent)", fontSize: 36, display: "block", marginBottom: 8 }} />
          <strong>Reclamo enviado</strong>
          <p style={{ color: "var(--text2)", fontSize: 13, margin: "4px 0 16px" }}>
            La administración lo recibirá y dará seguimiento.
          </p>
          <button type="button" className="btn" onClick={() => setFormKey((k) => k + 1)}>
            Enviar otro reclamo
          </button>
        </div>
      ) : (
        <form key={formKey} action={formAction}>
          <input type="hidden" name="residente_id" value={residenteId ?? ""} />
          <div className="form-row">
            <div className="form-group">
              <label>Enviar a</label>
              <select name="destinatario" defaultValue="administracion" disabled={!residenteId}>
                <option value="administracion">Administración</option>
                <option value="seguridad">Seguridad</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select name="tipo" defaultValue="reclamo" disabled={!residenteId}>
                <option value="denuncia">Denuncia</option>
                <option value="reclamo">Reclamo</option>
                <option value="sugerencia">Sugerencia</option>
                <option value="consulta">Consulta</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Asunto *</label>
            <input
              name="asunto"
              type="text"
              placeholder="Ej: luminaria, ruido, acceso, mantenimiento"
              disabled={!residenteId}
              required
            />
          </div>
          <div className="form-group">
            <label>Mensaje *</label>
            <textarea
              name="mensaje"
              placeholder="Escribá el detalle para que puedan darle seguimiento"
              rows={4}
              disabled={!residenteId}
              required
            />
          </div>
          {!residenteId && (
            <div className="empty" style={{ padding: "8px 0" }}>
              Seleccioná tu casa para enviar reclamos.
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
            style={{ gap: 8 }}
          >
            <i className="ti ti-send" />
            {pending ? "Enviando..." : "Enviar"}
          </button>
        </form>
      )}

      {reclamos.length > 0 && (
        <>
          <div className="divider" style={{ margin: "20px 0" }} />
          <div className="owner-section-title">Mis últimos mensajes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {reclamos.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{r.asunto}</strong>
                  <span className={`badge ${estadoBadge[r.estado] ?? "badge-gray"}`}>
                    {estadoLabel[r.estado] ?? r.estado}
                  </span>
                </div>
                <p style={{ color: "var(--text2)", fontSize: 13, margin: "0 0 4px" }}>{r.mensaje}</p>
                {r.respuesta && (
                  <div
                    style={{
                      background: "var(--surface2)",
                      borderRadius: 6,
                      marginTop: 8,
                      padding: "8px 10px",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "var(--text3)", fontSize: 11 }}>Respuesta de administración</span>
                    <p style={{ margin: "2px 0 0", color: "var(--text1)" }}>{r.respuesta}</p>
                  </div>
                )}
                <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 8 }}>
                  {new Date(r.created_at).toLocaleDateString("es-AR")} · {r.tipo} → {r.destinatario}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Actualizar page.tsx — conectar sección buzón**

Agregar función de fetch y import en page.tsx:

```tsx
import Reclamos from "./Reclamos";
import type { Reclamo } from "@/lib/types/database";

// Agregar función junto a las otras:
async function getReclamos(residenteId: string | null): Promise<Reclamo[]> {
  if (!residenteId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reclamos")
    .select("*")
    .eq("residente_id", residenteId)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []) as Reclamo[];
}
```

Agregar a `Promise.all` en `PortalPage`:

```tsx
const [residentes, reclamos] = await Promise.all([
  getResidentesDelUsuario(user.id),
  // ...ya existentes...
]);
// y agregar:
const reclamos = await getReclamos(selectedResidente?.id ?? null);
```

Reemplazar la sección estática `{/* Buzón de reclamos y sugerencias */}` con:

```tsx
<div className="owner-card">
  <div className="card-title">Buzón de reclamos y sugerencias</div>
  <Reclamos residenteId={selectedResidente?.id ?? null} reclamos={reclamos} />
</div>
```

- [ ] **Step 4: Verificar en browser**

Portal → seleccionar casa → enviar reclamo → verificar confirmación. Verificar en Supabase Table Editor que se creó el registro. Verificar que la lista de reclamos propios aparece debajo.

- [ ] **Step 5: Commit**

```bash
git add src/app/(portal)/portal/Reclamos.tsx src/app/(portal)/portal/actions.ts src/app/(portal)/portal/page.tsx
git commit -m "Portal: buzon de reclamos conectado con historial"
```

---

## Task 10: Reclamos — Panel Admin

**Files:**
- Create: `src/app/(app)/administracion/ReclamosAdmin.tsx`
- Create: `src/app/(app)/administracion/actions.ts`
- Modify: `src/app/(app)/administracion/page.tsx`

- [ ] **Step 1: Crear administracion/actions.ts**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function actualizarReclamo(
  id: string,
  _prev: null,
  formData: FormData,
): Promise<null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const estado = formData.get("estado") as string;
  const respuesta = (formData.get("respuesta") as string)?.trim() || null;

  await supabase
    .from("reclamos")
    .update({
      estado,
      respuesta,
      atendido_por: user.id,
      atendido_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/administracion");
  return null;
}
```

- [ ] **Step 2: Crear ReclamosAdmin.tsx**

```tsx
"use client";

import { useActionState, useState } from "react";
import { actualizarReclamo } from "./actions";
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
            · {new Date(reclamo.created_at).toLocaleDateString("es-AR")}
            {" · → "}{reclamo.destinatario}
          </div>
        </div>
        <i className={`ti ${expandido ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ color: "var(--text3)" }} />
      </button>

      {expandido && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text1)", fontSize: 14, margin: "12px 0" }}>{reclamo.mensaje}</p>
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
            <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: "flex-start", gap: 6 }}>
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
      {pendientes.map((r) => <ReclamoRow key={r.id} reclamo={r} />)}
      {resueltos.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", color: "var(--text2)", fontSize: 13 }}>
            {resueltos.length} resuelto{resueltos.length !== 1 ? "s" : ""}
          </summary>
          <div style={{ marginTop: 8 }}>
            {resueltos.map((r) => <ReclamoRow key={r.id} reclamo={r} />)}
          </div>
        </details>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Actualizar administracion/page.tsx**

Agregar imports:

```tsx
import ReclamosAdmin from "./ReclamosAdmin";
import type { ReclamoCompleto } from "@/lib/types/database";
```

Agregar función de fetch junto a las existentes:

```typescript
async function getReclamos(): Promise<ReclamoCompleto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reclamos")
    .select("*, residente:residentes(*, lote:lotes(*)), atendido_por_profile:profiles!reclamos_atendido_por_fkey(nombre, apellido)")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as ReclamoCompleto[];
}
```

Agregar al `Promise.all` existente:

```typescript
const [stats, vehiculos, residentes, comunicaciones, reclamos] = await Promise.all([
  getStats(),
  getVehiculosVisitas(),
  getResidentes(),
  getComunicaciones(),
  getReclamos(),
]);
```

Agregar sección al final del JSX (después del card de vehículos):

```tsx
<div className="card" style={{ marginTop: 24 }}>
  <div className="card-title">Buzón de reclamos y sugerencias</div>
  <ReclamosAdmin reclamos={reclamos} />
</div>
```

- [ ] **Step 4: Verificar en browser**

Loguearse como admin → ir a /administracion → verificar que aparecen los reclamos enviados desde el portal. Expandir uno, cambiar estado y agregar respuesta → guardar. Volver al portal como residente → verificar que la respuesta aparece.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/administracion/ReclamosAdmin.tsx src/app/(app)/administracion/actions.ts src/app/(app)/administracion/page.tsx
git commit -m "Admin: gestion de reclamos con estado y respuesta"
```
