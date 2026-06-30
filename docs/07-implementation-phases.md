# Fases de Implementación - Mi-San

## Objetivo

Construir el MVP de Mi-San de forma incremental, ordenada y segura.

La prioridad es entregar una primera versión usable, sin intentar construir todas las funcionalidades futuras desde el inicio.

---

# Fase 0 - Preparación del Proyecto

## Objetivo

Crear la base técnica del proyecto.

## Tareas

- Crear repositorio.
- Configurar monorepo o repos separados.
- Crear app mobile con Expo.
- Crear API NestJS.
- Configurar PostgreSQL.
- Configurar Prisma.
- Configurar Docker Compose.
- Configurar variables de entorno.
- Crear estructura base de carpetas.
- Configurar linting y formateo.

## Resultado Esperado

Proyecto base levantando correctamente en local.

---

# Fase 1 - Autenticación y Usuarios

## Objetivo

Permitir que los usuarios se registren e inicien sesión.

## Tareas Backend

- Registro.
- Login.
- JWT.
- Refresh token.
- Perfil de usuario.
- Validaciones.

## Tareas Frontend

- Pantalla de login.
- Pantalla de registro.
- Persistencia de sesión.
- Pantalla de perfil básica.

## Resultado Esperado

Un usuario puede registrarse, iniciar sesión y ver su perfil.

---

# Fase 2 - Creación de Sociedades

## Objetivo

Permitir que un organizador cree una sociedad.

## Tareas Backend

- Crear entidad Sociedad.
- Crear endpoints de sociedades.
- Validar reglas mínimas.
- Listar sociedades del usuario.

## Tareas Frontend

- Pantalla de listado de sociedades.
- Pantalla de crear sociedad.
- Detalle básico de sociedad.

## Resultado Esperado

Un usuario puede crear y consultar sus sociedades.

---

# Fase 3 - Participantes e Invitaciones

## Objetivo

Permitir agregar participantes a una sociedad.

## Tareas Backend

- Crear entidad ParticipanteSociedad.
- Crear entidad InvitacionSociedad.
- Invitar por teléfono o email.
- Aceptar invitación.
- Rechazar invitación.
- Listar participantes.

## Tareas Frontend

- Pantalla de participantes.
- Formulario de invitación.
- Vista de invitaciones pendientes.
- Acción de aceptar/rechazar.

## Resultado Esperado

Una sociedad puede tener participantes confirmados.

---

# Fase 4 - Turnos

## Objetivo

Configurar el orden de cobro de los participantes.

## Tareas Backend

- Crear entidad TurnoCobro.
- Generar turnos manuales.
- Generar turnos aleatorios.
- Validar que todos los participantes tengan turno.

## Tareas Frontend

- Pantalla de turnos.
- Reordenamiento manual.
- Botón generar aleatorio.
- Confirmación antes de congelar turnos.

## Resultado Esperado

Cada participante tiene un turno asignado.

---

# Fase 5 - Ciclos

## Objetivo

Iniciar y administrar ciclos de sociedades.

## Tareas Backend

- Crear entidad CicloSociedad.
- Iniciar ciclo.
- Finalizar ciclo.
- Crear cuotas del ciclo.
- Crear turnos del ciclo.

## Tareas Frontend

- Vista del ciclo activo.
- Estado del ciclo.
- Acciones de iniciar/finalizar ciclo.

## Resultado Esperado

Una sociedad puede iniciar un ciclo operativo.

---

# Fase 6 - Pagos

## Objetivo

Permitir registrar, reportar y confirmar pagos.

## Tareas Backend

- Crear entidad CuotaPago.
- Reportar pago.
- Confirmar pago.
- Rechazar pago.
- Marcar pagos atrasados.

## Tareas Frontend

- Pantalla de pagos.
- Reportar pago.
- Confirmar/rechazar pago para organizador.
- Badges de estado.

## Resultado Esperado

Los pagos pueden administrarse desde la app.

---

# Fase 7 - Evidencias de Pago

## Objetivo

Permitir adjuntar comprobantes de depósito o transferencia.

## Tareas Backend

- Configurar almacenamiento.
- Subir archivo.
- Asociar evidencia a cuota.
- Validar tipo y tamaño de archivo.

## Tareas Frontend

- Selector de imagen/documento.
- Subida de evidencia.
- Vista previa de comprobante.
- Estado del comprobante.

## Resultado Esperado

Los participantes pueden enviar comprobantes al organizador.

---

# Fase 8 - Notificaciones

## Objetivo

Enviar alertas importantes a usuarios.

## Tareas Backend

- Registrar push token.
- Enviar notificaciones.
- Guardar historial.
- Crear jobs de recordatorios.

## Tareas Frontend

- Solicitar permisos.
- Registrar dispositivo.
- Mostrar lista de notificaciones.
- Marcar como leídas.

## Resultado Esperado

La app puede avisar sobre pagos, cobros e invitaciones.

---

# Fase 9 - Historial y Reportes Básicos

## Objetivo

Dar transparencia al proceso.

## Tareas Backend

- Registrar historial de movimientos.
- Crear resumen de sociedad.
- Crear resumen por participante.

## Tareas Frontend

- Pantalla de historial.
- Resumen del participante.
- Resumen del organizador.

## Resultado Esperado

Los usuarios pueden consultar el pasado de la sociedad.

---

# Fase 10 - Publicidad Básica

## Objetivo

Agregar monetización inicial sin afectar la experiencia.

## Tareas

- Definir espacios de anuncios.
- Implementar banners no invasivos.
- Evitar anuncios en flujos críticos.
- Preparar futura integración con AdMob.

## Resultado Esperado

La app queda lista para monetización por anuncios.

---

# Criterio de MVP 0.1

El MVP 0.1 estará listo cuando:

- Un usuario pueda registrarse.
- Un usuario pueda crear una sociedad.
- Se puedan agregar participantes.
- Se puedan asignar turnos.
- Se pueda iniciar un ciclo.
- Se puedan registrar pagos.
- El organizador pueda confirmar pagos.
- El participante pueda ver su estado.
- Exista historial básico.
