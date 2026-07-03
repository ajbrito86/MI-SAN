# Reglas de Backend - Mi-San

## Objetivo

Construir una API robusta, segura, escalable y mantenible para soportar la operación de Mi-San.

---

# Stack Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- Docker

---

# Arquitectura

Cada módulo deberá seguir la siguiente estructura:

/module

- controller
- service
- dto
- repository
- mapper
- guards
- decorators
- tests

---

# Módulos Iniciales

## Auth

Responsable de:

- Registro.
- Login.
- Refresh token.
- Recuperación de contraseña.
- Cierre de sesión.

Endpoints:

POST /auth/register

POST /auth/login

POST /auth/refresh

POST /auth/forgot-password

POST /auth/reset-password

POST /auth/logout

---

## Users

Responsable de:

- Perfil.
- Actualización de datos.
- Foto de perfil.

Endpoints:

GET /users/me

PATCH /users/me

POST /users/me/photo

---

## Societies

Responsable de:

- Crear sociedad.
- Editar sociedad.
- Consultar sociedades.
- Cerrar sociedad.

Endpoints:

POST /societies

GET /societies

GET /societies/:id

PATCH /societies/:id

POST /societies/:id/close

---

## Participants

Responsable de:

- Invitaciones.
- Aceptación.
- Expulsión.
- Consulta de participantes.

Endpoints:

POST /societies/:id/invitations

POST /invitations/:id/accept

POST /invitations/:id/reject

DELETE /participants/:id

---

## Cycles

Responsable de:

- Crear ciclos.
- Iniciar ciclos.
- Finalizar ciclos.

Endpoints:

POST /societies/:id/cycles

POST /cycles/:id/start

POST /cycles/:id/finish

---

## Turns

Responsable de:

- Generación manual.
- Generación aleatoria.
- Consulta de turnos.

Endpoints:

POST /cycles/:id/turns/random

POST /cycles/:id/turns/manual

GET /cycles/:id/turns

---

## Payments

Responsable de:

- Reportar pagos.
- Confirmar pagos.
- Rechazar pagos.

Endpoints:

POST /payments/report

POST /payments/:id/confirm

POST /payments/:id/reject

GET /payments/my

---

## Uploads

Responsable de:

- Subida de evidencias.

Endpoints:

POST /uploads/evidence

---

## Notifications

Responsable de:

- Push notifications.
- Historial.

Endpoints:

GET /notifications

PATCH /notifications/:id/read

---

# Seguridad

Todos los endpoints privados deberán requerir JWT.

Se implementarán:

- JwtAuthGuard.
- RolesGuard.

---

# Roles

Roles disponibles:

- ORGANIZADOR
- PARTICIPANTE

El rol es contextual a cada sociedad.

---

# Validaciones

Todo endpoint deberá validar entrada mediante DTO + class-validator.

Nunca confiar en validaciones del frontend.

---

# Reglas Críticas

- Solo el organizador puede confirmar pagos.
- Solo el organizador puede expulsar participantes.
- Una sociedad iniciada no puede cambiar cantidad de participantes sin proceso explícito.
- No permitir iniciar ciclos sin turnos definidos.
- No permitir pagos sobre ciclos cerrados.

---

# Auditoría

Toda acción importante deberá generar un registro en HistorialMovimiento.

Ejemplos:

- Sociedad creada.
- Participante agregado.
- Pago confirmado.
- Participante expulsado.
- Ciclo iniciado.

---

# Jobs Programados

Usar cron jobs para:

- Detectar pagos atrasados.
- Enviar recordatorios.
- Generar alertas automáticas.

Frecuencia inicial:

Cada hora.

---

# Logs

Usar Logger de NestJS.

Registrar:

- Errores.
- Acciones críticas.
- Eventos de seguridad.

Nunca registrar contraseñas ni tokens.

---

# Principios

- Código limpio.
- Servicios pequeños.
- Alta cohesión.
- Bajo acoplamiento.
- Manejo centralizado de errores.
- Respuestas API consistentes.
