# Reglas de Negocio - Mi-San

## Filosofía del MVP

Mi-San NO custodiará dinero.

La aplicación únicamente administra y registra la información relacionada con la sociedad.

Todas las decisiones financieras continúan siendo responsabilidad del organizador.

---

# RN-001 Creación de Sociedad

Un usuario autenticado podrá crear una sociedad.

Datos mínimos:

- Nombre.
- Monto por cuota.
- Frecuencia.
- Cantidad de participantes.
- Modalidad de turnos.
- Fecha de inicio.

El creador se convertirá automáticamente en el organizador.

---

# RN-002 Participantes

Una sociedad debe tener al menos 2 participantes.

No existe límite técnico inicial de participantes.

Un mismo usuario puede participar en múltiples sociedades.

Un usuario puede ser organizador y participante simultáneamente.

---

# RN-003 Invitaciones

Los participantes podrán ser invitados mediante:

- Teléfono.
- Correo electrónico.
- Código de invitación.

El invitado deberá aceptar la invitación para formar parte oficialmente.

---

# RN-004 Modalidad de Turnos

Existen dos modalidades:

## Manual

El organizador asigna libremente el orden de cobro.

## Aleatoria

La aplicación genera el orden automáticamente utilizando un algoritmo pseudoaleatorio.

Una vez iniciado el ciclo, el orden no podrá modificarse sin confirmación explícita del organizador.

---

# RN-005 Inicio del Ciclo

Un ciclo podrá iniciar únicamente cuando:

- Todos los participantes hayan aceptado.
- Exista un turno asignado para cada participante.

---

# RN-006 Registro de Pagos

Cada participante deberá registrar el pago de su cuota.

Tipos de pago soportados:

- Efectivo.
- Depósito bancario.
- Transferencia.

---

# RN-007 Evidencias

Si el pago es realizado mediante depósito o transferencia, el participante podrá adjuntar evidencias.

Las evidencias deberán ser revisadas por el organizador.

---

# RN-008 Confirmación de Pago

Únicamente el organizador podrá confirmar pagos.

Estados:

- PENDIENTE.
- REPORTADO.
- CONFIRMADO.
- RECHAZADO.
- ATRASADO.
- INCUMPLIDO.

---

# RN-009 Morosidad

Una cuota cuya fecha límite haya expirado y no haya sido confirmada será marcada automáticamente como ATRASADA.

El organizador decidirá las acciones posteriores fuera de la aplicación.

---

# RN-010 Historial

Toda acción importante deberá registrarse en el historial.

Ejemplos:

- Participante agregado.
- Participante expulsado.
- Pago confirmado.
- Turno modificado.
- Nuevo ciclo.

---

# RN-011 Nuevo Ciclo

Una sociedad podrá tener múltiples ciclos.

Al finalizar un ciclo, el organizador podrá crear uno nuevo reutilizando los participantes existentes.

---

# RN-012 Expulsión

El organizador podrá expulsar participantes.

La aplicación deberá solicitar motivo obligatorio.

---

# RN-013 Notificaciones

La aplicación enviará notificaciones automáticas para:

- Próximo vencimiento.
- Pago confirmado.
- Pago rechazado.
- Invitaciones.
- Inicio de nuevo ciclo.
- Próximo beneficiario.

---

# RN-014 Transparencia

Todos los participantes podrán visualizar:

- Orden de turnos.
- Historial de pagos propios.
- Estado general de la sociedad.

No podrán modificar información de otros participantes.

---

# RN-015 Cierre de Sociedad

El organizador podrá cerrar definitivamente una sociedad.

Una sociedad cerrada quedará disponible únicamente en modo consulta.
