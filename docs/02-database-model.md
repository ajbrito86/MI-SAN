# Modelo de Base de Datos - Mi-San

## Convenciones Generales

Todas las tablas deberán incluir:

- id
- isActive
- createdAt
- updatedAt

Fechas en UTC.

---

# Usuario

Representa una persona registrada en la plataforma.

Campos:

- id
- nombres
- apellidos
- telefono
- email
- passwordHash
- fotoPerfilUrl
- pushToken
- isVerified
- isActive
- createdAt
- updatedAt

Restricciones:

- email único.
- telefono único.

---

# Sociedad

Representa una sociedad o san creado por un organizador.

Campos:

- id
- nombre
- descripcion
- organizadorId
- montoCuota
- frecuencia
- modalidadTurnos
- tipoPago
- cantidadParticipantes
- fechaInicio
- fechaFinEstimada
- estado
- isActive
- createdAt
- updatedAt

Relaciones:

- Una sociedad tiene un organizador.
- Una sociedad posee múltiples participantes.
- Una sociedad puede tener múltiples ciclos.

---

# ParticipanteSociedad

Representa la participación de un usuario dentro de una sociedad.

Campos:

- id
- sociedadId
- usuarioId
- turno
- fechaIngreso
- estadoParticipante
- observacion
- isActive
- createdAt
- updatedAt

Estados posibles:

- INVITADO
- ACTIVO
- RETIRADO
- EXPULSADO

Restricción:

- usuarioId + sociedadId debe ser único.

---

# InvitacionSociedad

Permite invitar participantes.

Campos:

- id
- sociedadId
- telefonoInvitado
- emailInvitado
- enviadaPor
- estado
- fechaRespuesta
- createdAt

Estados:

- PENDIENTE
- ACEPTADA
- RECHAZADA
- EXPIRADA

---

# CicloSociedad

Representa una ejecución completa de la sociedad.

Ejemplo:

Sociedad de 12 participantes.

Ciclo #1:
Enero - Diciembre.

Ciclo #2:
Enero siguiente - Diciembre.

Campos:

- id
- sociedadId
- numeroCiclo
- fechaInicio
- fechaFin
- estado
- createdAt

Estados:

- CONFIGURACION
- ACTIVO
- COMPLETADO
- CANCELADO

---

# TurnoCobro

Define el orden de cobro.

Campos:

- id
- cicloId
- participanteId
- numeroTurno
- fechaProgramada
- montoCobro
- estado
- createdAt

Estados:

- PENDIENTE
- PAGADO
- REPROGRAMADO

---

# CuotaPago

Representa el aporte que cada participante debe realizar.

Campos:

- id
- cicloId
- participanteId
- numeroCuota
- monto
- fechaVencimiento
- fechaPago
- estado
- confirmadoPor
- observacion
- createdAt

Estados:

- PENDIENTE
- REPORTADO
- CONFIRMADO
- ATRASADO
- INCUMPLIDO

---

# EvidenciaPago

Campos:

- id
- cuotaPagoId
- urlArchivo
- nombreArchivo
- mimeType
- cargadoPor
- createdAt

Un pago puede tener múltiples evidencias.

---

# Notificacion

Campos:

- id
- usuarioId
- titulo
- mensaje
- tipo
- leida
- createdAt

Tipos:

- RECORDATORIO_PAGO
- PAGO_CONFIRMADO
- PAGO_RECHAZADO
- INVITACION
- NUEVO_COBRO

---

# HistorialMovimiento

Auditoría funcional.

Campos:

- id
- sociedadId
- usuarioId
- accion
- descripcion
- realizadoPor
- metadataJson
- createdAt

Ejemplos:

- Participante agregado.
- Pago confirmado.
- Participante expulsado.
- Nuevo ciclo creado.
- Turno modificado.

---

# Relaciones Principales

Usuario 1:N Sociedad (organizador)

Sociedad 1:N ParticipanteSociedad

Sociedad 1:N CicloSociedad

CicloSociedad 1:N TurnoCobro

CicloSociedad 1:N CuotaPago

CuotaPago 1:N EvidenciaPago

Usuario 1:N Notificacion
