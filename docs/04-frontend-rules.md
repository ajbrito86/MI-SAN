# Reglas de Frontend - Mi-San

## Objetivo

Construir una aplicación móvil clara, rápida y sencilla para administrar sociedades de ahorro tradicionales.

El frontend debe priorizar:

- Simplicidad.
- Claridad visual.
- Confianza.
- Bajo esfuerzo para usuarios no técnicos.
- Experiencia mobile first.

---

# Stack Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind
- TanStack Query
- Zustand
- React Hook Form
- Zod

---

# Estructura Recomendada

/app

- index.tsx
- login.tsx
- register.tsx
- forgot-password.tsx

/app/(tabs)

- home.tsx
- societies.tsx
- notifications.tsx
- profile.tsx

/app/societies

- create.tsx
- [id].tsx
- [id]/participants.tsx
- [id]/turns.tsx
- [id]/payments.tsx
- [id]/history.tsx
- [id]/settings.tsx

/src

- components
- features
- hooks
- services
- stores
- schemas
- types
- utils

---

# Pantallas Principales

## Login

Debe permitir:

- Iniciar sesión con teléfono o email.
- Ingresar contraseña.
- Ir a registro.
- Recuperar contraseña.

## Registro

Debe solicitar:

- Nombres.
- Apellidos.
- Teléfono.
- Email.
- Contraseña.

## Home

Debe mostrar resumen general:

- Sociedades activas.
- Próximo pago.
- Próximo cobro.
- Pagos pendientes.
- Alertas importantes.

## Mis Sociedades

Lista de sociedades donde el usuario participa u organiza.

Cada tarjeta debe mostrar:

- Nombre de la sociedad.
- Monto de cuota.
- Frecuencia.
- Estado.
- Rol del usuario.
- Próxima fecha importante.

## Detalle de Sociedad

Debe mostrar:

- Nombre.
- Estado.
- Monto de cuota.
- Frecuencia.
- Participantes.
- Turno actual.
- Próximo beneficiario.
- Botones según rol.

---

# Experiencia del Organizador

El organizador debe tener acceso a:

- Crear sociedad.
- Editar sociedad antes de iniciar.
- Invitar participantes.
- Asignar turnos.
- Generar turnos aleatorios.
- Confirmar pagos.
- Rechazar pagos.
- Marcar participante como atrasado.
- Expulsar participante.
- Crear nuevo ciclo.
- Cerrar sociedad.

---

# Experiencia del Participante

El participante debe poder:

- Ver sus sociedades.
- Ver su turno.
- Ver cuánto ha pagado.
- Ver cuánto debe.
- Ver historial.
- Reportar pago.
- Adjuntar comprobante.
- Recibir notificaciones.

---

# Estados Visuales

## Pago Pendiente

Color sugerido: amarillo.

## Pago Reportado

Color sugerido: azul.

## Pago Confirmado

Color sugerido: verde.

## Pago Atrasado

Color sugerido: naranja.

## Pago Incumplido

Color sugerido: rojo.

---

# Componentes Reutilizables

- AppButton
- AppInput
- AppCard
- AppBadge
- AppHeader
- EmptyState
- LoadingState
- ErrorState
- PaymentStatusBadge
- SocietyCard
- ParticipantCard
- TurnCard
- EvidenceUploader

---

# Formularios

Todo formulario deberá usar:

- React Hook Form.
- Zod para validación.
- Mensajes claros en español.

Ejemplo:

- "El nombre es obligatorio."
- "El monto debe ser mayor que cero."
- "Debe seleccionar una frecuencia."

---

# Manejo de Errores

Los errores deben mostrarse de forma clara y humana.

No mostrar mensajes técnicos del backend directamente.

Ejemplos:

Incorrecto:

- Prisma error.
- Internal server error.
- 500.

Correcto:

- "No pudimos guardar los cambios. Inténtalo nuevamente."
- "No tienes permiso para realizar esta acción."
- "La sociedad ya fue iniciada y no puede modificarse."

---

# Notificaciones en App

Usar toasts para acciones rápidas:

- Sociedad creada.
- Pago reportado.
- Comprobante enviado.
- Pago confirmado.
- Invitación aceptada.

---

# Reglas de Navegación

- El usuario no autenticado solo puede acceder a login, registro y recuperación.
- El usuario autenticado entra al Home.
- Las acciones del organizador solo se muestran si el usuario tiene rol ORGANIZADOR en esa sociedad.
- Las acciones del participante solo se muestran si pertenece a la sociedad.

---

# Principios UI/UX

- Botones grandes.
- Textos claros.
- Nada de pantallas saturadas.
- Priorizar tarjetas y badges.
- Evitar tablas complejas en mobile.
- El estado de pago debe ser visible de inmediato.
- El próximo pago y próximo cobro deben estar siempre destacados.

---

# Publicidad en MVP

La app podrá incluir espacios de anuncios en:

- Home.
- Lista de sociedades.
- Detalle de sociedad.

Reglas:

- Los anuncios no deben bloquear acciones críticas.
- No mostrar anuncios dentro del flujo de reporte de pago.
- No mostrar anuncios dentro del flujo de confirmación de pago.
- Mantener la experiencia limpia y confiable.
