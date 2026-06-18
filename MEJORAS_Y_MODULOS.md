# Mejoras y modulos futuros - Bon Desti Access

Este documento resume las mejoras recomendadas para que el sistema sea mas robusto y los modulos que conviene agregar mas adelante. La prioridad inmediata es consolidar la base Next.js + Supabase sin romper lo que ya funciona.

## Prioridad 1 - Estructura y robustez

### Migracion ordenada desde legacy a Next.js

- Mantener la app actual funcionando como `legacy` mientras se migran pantallas de a una.
- Pasar gradualmente cada flujo a componentes reales de Next.js.
- Evitar reescribir todo de golpe para no perder funcionalidades ya probadas.
- Separar claramente:
  - Pantallas.
  - Componentes reutilizables.
  - Logica de negocio.
  - Acceso a datos.
  - Validaciones.

### Supabase como base central

- Usar Supabase Postgres como fuente unica de verdad.
- Dejar de depender de datos guardados solo en el navegador.
- Crear tablas con relaciones claras para:
  - Usuarios.
  - Residentes.
  - Lotes.
  - Visitantes.
  - Ingresos y egresos.
  - Emergencias.
  - Obras y personal.
  - Pases QR.
  - Auditoria.
- Activar Row Level Security en todas las tablas importantes.
- Definir politicas por rol para que cada usuario vea solo lo que corresponde.

### Usuarios reales y roles

- Reemplazar credenciales fijas por Supabase Auth.
- Crear roles reales:
  - Administradora.
  - Seguridad.
  - Residente.
  - Superadmin, si el sistema se vende a mas barrios.
- Controlar permisos desde base de datos, no desde condicionales sueltos en frontend.
- Agregar sesiones persistentes y cierre de sesion correcto.

### Arquitectura de datos

- Definir un modelo de datos estable antes de seguir creciendo.
- Usar IDs internos para cada entidad.
- Evitar duplicados de lotes, residentes o visitantes.
- Normalizar campos importantes:
  - Documento.
  - Telefono.
  - Patente.
  - Numero de lote.
  - Estado.
  - Fechas.
- Agregar timestamps en tablas principales:
  - `created_at`.
  - `updated_at`.
  - `deleted_at`, si se usa borrado logico.

### Validaciones

- Validar datos tanto en frontend como en backend.
- Evitar guardar registros incompletos o inconsistentes.
- Validar Excel antes de importarlo.
- Mostrar errores claros cuando un dato no se puede cargar.
- Evitar que el sistema acepte registros duplicados sin advertirlo.

### Manejo de errores

- Centralizar errores de Supabase y formularios.
- Mostrar mensajes entendibles para el usuario.
- Registrar errores tecnicos para poder diagnosticarlos.
- Evitar que una falla deje la pantalla en blanco.

### Auditoria

- Implementado como primera etapa en la app legacy: las acciones importantes se guardan localmente en `gd_auditoria`.
- Cada evento registra fecha, actor, rol, entidad, identificador, detalle y, cuando aplica, valores anteriores y nuevos.
- Esta auditoria local cubre:
  - Creacion y edicion de accesos.
  - Ingresos por QR de residente o pase temporal.
  - Emergencias creadas y marcadas como atendidas.
  - Eliminacion individual o masiva de registros.
  - Importaciones desde Excel.
  - Altas y cambios sobre lotes y residentes.
- Al migrar a Supabase, mover estos eventos a una tabla `audit_logs` con RLS y almacenamiento inmutable.
- Guardar acciones importantes:
  - Quien creo un ingreso.
  - Quien marco una emergencia como resuelta.
  - Quien elimino registros.
  - Quien importo datos desde Excel.
  - Cambios sobre residentes o lotes.
- Usar auditoria para trazabilidad y respaldo frente a reclamos.

### Eliminacion segura

- Usar borrado logico para datos sensibles o historicos.
- Permitir eliminar definitivamente solo cuando sea necesario y con permisos altos.
- Para emergencias o registros ya resueltos:
  - Permitir seleccion individual.
  - Permitir seleccion masiva.
  - Pedir confirmacion antes de eliminar.

### Importacion desde Excel

- Crear un flujo robusto para cargar los 66 lotes.
- Validar columnas obligatorias.
- Mostrar resumen antes de importar:
  - Cantidad de lotes detectados.
  - Cantidad de residentes.
  - Registros con errores.
  - Duplicados.
- Permitir corregir errores antes de confirmar.
- Guardar historial de importaciones.

### Seguridad

- No guardar claves sensibles en frontend.
- Usar variables de entorno para Supabase.
- Separar anon key de service role key.
- Nunca exponer service role key en navegador.
- Aplicar permisos de base de datos con RLS.
- Revisar que rutas privadas no sean accesibles sin sesion.

### Performance

- Evitar cargar toda la base en cada pantalla.
- Usar filtros, paginacion y busqueda desde base de datos.
- Optimizar listados grandes.
- Evitar scripts gigantes dentro de un solo HTML cuando se migre a componentes.
- Mantener assets livianos.

### Responsive y experiencia movil

- Probar cada pantalla en celular real o viewport movil.
- Mantener botones grandes para seguridad y garita.
- Evitar textos cortados.
- Usar tipografias consistentes.
- Priorizar flujos rapidos:
  - Escanear QR.
  - Registrar ingreso.
  - Ver emergencia.
  - Buscar residente.

### Deploy y mantenimiento

- Preparar despliegue en Vercel.
- Configurar variables de entorno por ambiente.
- Tener ambiente de prueba antes de tocar produccion.
- Usar backups automaticos de Supabase.
- Documentar pasos para restaurar datos.
- Mantener commits chicos y claros.

## Prioridad 2 - Modulos a agregar

### Panel web de administracion

- Dashboard principal para administradora.
- Vista general de ingresos, residentes, lotes y alertas.
- Acceso a configuracion del barrio.
- Gestion de usuarios y permisos.
- Busqueda global.

### Modulo de residentes

- Alta, baja y edicion de residentes.
- Asociacion de residentes a lotes.
- Datos de contacto.
- Vehiculos autorizados.
- Estado activo/inactivo.
- Historial de movimientos relacionados.

### Modulo de lotes

- Carga completa de los 66 lotes.
- Estado del lote:
  - Ocupado.
  - Disponible.
  - En obra.
  - Sin datos.
- Propietarios e inquilinos asociados.
- Observaciones internas.

### Modulo de seguridad

- Panel simple para garita.
- Acciones rapidas:
  - Escanear QR.
  - Registrar ingreso.
  - Registrar salida.
  - Emergencia.
- Busqueda rapida por lote, nombre, DNI o patente.
- Historial del dia.

### Modulo de visitantes

- Registro de visitante.
- Relacion con residente/lote que autoriza.
- Documento, patente y observaciones.
- Estado:
  - Pendiente.
  - Ingresado.
  - Retirado.
  - Rechazado.
- Historial de visitas.

### Modulo de QR y pases

- Generacion de pases QR temporales.
- QR con vencimiento.
- QR de unico uso, si aplica.
- Validacion desde garita.
- Registro automatico de uso.
- Invalidacion manual de pases.

### Modulo de emergencias

- Registro rapido de emergencia.
- Estado:
  - Activa.
  - En proceso.
  - Resuelta.
  - Eliminada.
- Responsable que la atendio.
- Fecha y hora de resolucion.
- Eliminacion individual o masiva para registros resueltos o vencidos.

### Modulo de obras y personal

- Alta de personal de obra.
- Asociacion con lote.
- Horarios permitidos.
- Documentacion basica.
- Estado activo/inactivo.
- Registro de ingresos y salidas.

### Modulo de reportes

- Reporte diario de ingresos y salidas.
- Reporte por lote.
- Reporte por visitante.
- Reporte de emergencias.
- Exportacion a Excel o PDF.
- Filtros por fecha, tipo y estado.

### Modulo de auditoria

- Historial de acciones importantes.
- Filtro por usuario, fecha y accion.
- Registro de cambios sobre datos sensibles.
- Util para administracion y soporte.

### Modulo multi-barrio, si se vende a mas clientes

- Separar datos por barrio o consorcio.
- Cada cliente con sus propios usuarios, lotes y configuracion.
- Superadmin para administrar clientes.
- Planes, limites y estado de suscripcion.

### Modulo de configuracion

- Datos del barrio.
- Logo.
- Colores principales.
- Horarios permitidos.
- Tipos de acceso.
- Reglas de QR.
- Permisos por rol.

## Orden recomendado de implementacion

1. Definir modelo de datos en Supabase.
2. Implementar usuarios reales y roles.
3. Migrar residentes y lotes.
4. Migrar ingresos, visitantes y QR.
5. Migrar emergencias.
6. Crear panel web de administracion.
7. Agregar reportes.
8. Agregar auditoria completa.
9. Preparar deploy estable.
10. Evaluar multi-barrio si se vende a otros clientes.

## Criterio comercial recomendado

- Cobrar una entrada inicial por instalacion, carga de datos y puesta en marcha.
- Cobrar mantenimiento mensual por soporte, backups, mejoras menores, hosting y control de funcionamiento.
- Separar claramente:
  - Desarrollo inicial.
  - Carga de datos.
  - Mantenimiento mensual.
  - Nuevos modulos o cambios grandes.
