# Catálogos y Enums - Mi-San

## Objetivo

Centralizar todos los valores de catálogo y enumeraciones utilizados por el sistema.

---

# FrecuenciaSociedad

Determina cada cuánto tiempo los participantes deben aportar.

Valores:

- SEMANAL
- QUINCENAL
- MENSUAL

---

# ModalidadTurno

Define cómo se asignan los turnos.

Valores:

- MANUAL
- ALEATORIA

---

# TipoPago

Define cómo los participantes realizan sus aportes.

Valores:

- EFECTIVO
- DEPOSITO_BANCARIO
- TRANSFERENCIA
- MIXTO

---

# EstadoSociedad

Valores:

- CONFIGURACION
- ACTIVA
- FINALIZADA
- CANCELADA

Descripción:

CONFIGURACION:
La sociedad aún no ha iniciado.

ACTIVA:
La sociedad está operando.

FINALIZADA:
Todos los ciclos finalizaron.

CANCELADA:
La sociedad fue cerrada antes de tiempo.

---

# EstadoParticipante

Valores:

- INVITADO
- ACTIVO
- RETIRADO
- EXPULSADO

---

# EstadoInvitacion

Valores:

- PENDIENTE
- ACEPTADA
- RECHAZADA
- EXPIRADA

---

# EstadoCiclo

Valores:

- CONFIGURACION
- ACTIVO
- COMPLETADO
- CANCELADO

---

# EstadoTurno

Valores:

- PENDIENTE
- PAGADO
- REPROGRAMADO

---

# EstadoPago

Valores:

- PENDIENTE
- REPORTADO
- CONFIRMADO
- RECHAZADO
- ATRASADO
- INCUMPLIDO

Descripción:

PENDIENTE:
No se ha reportado pago.

REPORTADO:
El participante indicó que pagó.

CONFIRMADO:
El organizador confirmó el pago.

RECHAZADO:
El organizador rechazó la evidencia.

ATRASADO:
Venció la fecha límite.

INCUMPLIDO:
El participante no pagó.

---

# TipoNotificacion

Valores:

- RECORDATORIO_PAGO
- PAGO_CONFIRMADO
- PAGO_RECHAZADO
- INVITACION_RECIBIDA
- INVITACION_ACEPTADA
- NUEVO_CICLO
- PROXIMO_COBRO
- PROXIMO_VENCIMIENTO
- PARTICIPANTE_EXPULSADO

---

# RolSociedad

Rol contextual del usuario dentro de una sociedad.

Valores:

- ORGANIZADOR
- PARTICIPANTE

---

# TipoMovimientoHistorial

Valores:

- SOCIEDAD_CREADA
- SOCIEDAD_EDITADA
- SOCIEDAD_CERRADA
- PARTICIPANTE_AGREGADO
- PARTICIPANTE_EXPULSADO
- INVITACION_ENVIADA
- INVITACION_ACEPTADA
- CICLO_CREADO
- CICLO_INICIADO
- CICLO_FINALIZADO
- TURNO_GENERADO
- PAGO_REPORTADO
- PAGO_CONFIRMADO
- PAGO_RECHAZADO
- EVIDENCIA_CARGADA

---

# TipoArchivo

Valores:

- FOTO_PERFIL
- EVIDENCIA_PAGO

---

# Configuración Global Recomendada

## Tamaño Máximo Evidencia

10 MB

## Extensiones Permitidas

Imágenes:

- jpg
- jpeg
- png
- webp

Documentos:

- pdf

---

# Recomendación Técnica

Todos los enums deberán existir:

1. En backend.
2. En frontend.
3. Compartidos mediante contratos o librería común cuando sea posible.
