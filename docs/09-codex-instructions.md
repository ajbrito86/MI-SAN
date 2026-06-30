# Instrucciones para Codex - Mi-San

## Objetivo

Construir el MVP de Mi-San de forma incremental, limpia y mantenible.

Mi-San es una aplicación móvil para administrar sociedades de ahorro tradicionales.

La aplicación NO custodiará dinero en el MVP.

La aplicación únicamente sustituye el cuaderno, Excel o grupo de WhatsApp usado por el organizador.

---

# Reglas Generales

1. No construir funcionalidades fuera del alcance del MVP.
2. No implementar pagos digitales en el MVP.
3. No implementar custodia de dinero.
4. No asumir integraciones bancarias.
5. No agregar complejidad innecesaria.
6. Priorizar código simple y mantenible.
7. Mantener frontend y backend fuertemente tipados.
8. Toda lógica crítica debe estar validada en backend.
9. El frontend no debe confiar en reglas solo visuales.
10. Mantener mensajes de error claros en español.

---

# Stack Oficial

## Mobile

- React Native
- Expo
- TypeScript
- Expo Router
- NativeWind
- TanStack Query
- Zustand
- React Hook Form
- Zod

## Backend

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT

## Infraestructura

- Docker
- Docker Compose

---

# Orden de Implementación

Codex debe seguir el orden definido en:

`07-implementation-phases.md`

No debe saltar directamente a funcionalidades futuras.

---

# Convenciones de Código

## Idioma

- UI en español.
- Código en inglés cuando sea técnico.
- Comentarios solo cuando aporten claridad real.

## Naming

Usar nombres claros y consistentes.

Ejemplos:

- Society
- SocietyParticipant
- SocietyCycle
- PaymentQuota
- PaymentEvidence
- Notification
- MovementHistory

---

# Backend

## Estructura por módulo

Cada módulo debe contener:

- controller
- service
- dto
- repository
- tests

## Validación

Todo endpoint que reciba datos debe validar usando DTOs.

No confiar en datos del frontend.

## Seguridad

Todos los endpoints privados deben requerir JWT.

Validar siempre que el usuario tenga permiso sobre la sociedad antes de consultar o modificar datos.

---

# Frontend

## Pantallas

Crear pantallas simples, funcionales y reutilizables.

Priorizar:

- Cards.
- Badges.
- Formularios cortos.
- Estados vacíos.
- Loading states.

## Manejo de Estado

- TanStack Query para datos del backend.
- Zustand para estado local global.

## Formularios

Usar:

- React Hook Form.
- Zod.

---

# Reglas de Negocio Críticas

Codex debe respetar:

1. Solo el organizador puede confirmar pagos.
2. Solo el organizador puede expulsar participantes.
3. Una sociedad no puede iniciar sin participantes confirmados.
4. Una sociedad no puede iniciar sin turnos asignados.
5. Un pago reportado debe ser confirmado o rechazado por el organizador.
6. Si una cuota vence sin confirmación, debe marcarse como atrasada.
7. Los participantes no pueden modificar pagos de otros participantes.
8. El organizador no custodia dinero mediante la app; solo registra información.
9. La app no debe mostrar lenguaje que sugiera que maneja, guarda o protege dinero.
10. La app no debe prometer garantía de pago.

---

# Manejo de Errores

No mostrar errores técnicos al usuario.

Ejemplos correctos:

- "No tienes permiso para realizar esta acción."
- "No pudimos guardar los cambios. Inténtalo nuevamente."
- "La sociedad ya fue iniciada y no puede modificarse."

Ejemplos incorrectos:

- Prisma error.
- 500 Internal Server Error.
- JWT malformed.

---

# Auditoría

Registrar acciones importantes en MovementHistory:

- Sociedad creada.
- Participante invitado.
- Participante aceptado.
- Ciclo iniciado.
- Turnos generados.
- Pago reportado.
- Pago confirmado.
- Pago rechazado.
- Participante expulsado.

---

# Publicidad

La publicidad debe considerarse desde el diseño, pero no debe bloquear el MVP.

Reglas:

- No mostrar anuncios en acciones críticas.
- No mostrar anuncios al confirmar pagos.
- No mostrar anuncios al reportar pagos.
- No saturar la experiencia.

---

# Fuera de Alcance del MVP

No implementar todavía:

- Pagos integrados.
- Wallet.
- Custodia.
- Integración bancaria.
- KYC.
- Verificación de identidad avanzada.
- Scoring crediticio.
- Marketplace de sociedades públicas.
- Chat interno.
- Garantías.
- Contratos legales digitales.
- Suscripciones premium.

---

# Criterio de Aceptación del MVP

El MVP estará aceptable cuando:

- Un usuario pueda registrarse e iniciar sesión.
- Un organizador pueda crear una sociedad.
- El organizador pueda invitar participantes.
- Los participantes puedan aceptar invitaciones.
- Se puedan asignar turnos manuales o aleatorios.
- Se pueda iniciar un ciclo.
- Se generen cuotas.
- El participante pueda reportar pago.
- El participante pueda adjuntar comprobante.
- El organizador pueda confirmar o rechazar pagos.
- Se pueda ver historial.
- Se puedan enviar notificaciones básicas.

---

# Nota Final

La prioridad es construir una app usable y confiable.

No construir una fintech todavía.

Primero sustituimos el cuaderno.

Luego evaluamos crecimiento.
