# 02 - Ads AdMob y Premium - MI-SAN

## Objetivo

Definir la estrategia oficial de monetización mediante anuncios para MI-SAN garantizando una experiencia de usuario excelente.

Principio rector:

**La experiencia del usuario está por encima de los ingresos publicitarios.**

---

# Plataforma publicitaria oficial

Para la V1 se utilizará exclusivamente:

- Google AdMob

No se integrarán redes adicionales en la primera versión.

---

# Planes soportados

## GRATIS_TRIAL

- Sin anuncios.

## GRATIS_ADS

- Mostrar anuncios según las reglas definidas.

## PREMIUM_SIN_ADS

- No mostrar ningún anuncio.

---

# Regla principal

Antes de renderizar cualquier anuncio:

```typescript
if (!usuario.suscripcion.mostrarAds) return null;
```

---

# Tipos de anuncios permitidos

## Banner Ads

Uso permitido.

Ubicación:

Parte inferior de determinadas pantallas.

---

## Interstitial Ads

Permitidos únicamente en momentos naturales del flujo.

Nunca abusar de ellos.

Frecuencia máxima sugerida:

1 anuncio cada 10 minutos.

---

## Rewarded Ads

No utilizar en la V1.

---

## App Open Ads

No utilizar en la V1.

---

# Pantallas donde SI se permiten anuncios

- Dashboard principal.
- Listado histórico de SANes.
- Pantallas de estadísticas.
- Reportes.
- Historiales extensos.

---

# Pantallas donde NO se permiten anuncios

## Flujo crítico

Nunca mostrar anuncios en:

- Login.
- Registro.
- Recuperación de contraseña.
- Creación de SAN.
- Registro de pagos.
- Confirmación de pagos.
- Pantallas de errores.
- Configuración de cuenta.
- Pantallas Premium.
- Pantallas administrativas.

---

# Frecuencia de Interstitials

Mostrar únicamente:

- Al salir de determinados módulos.
- Al navegar entre secciones secundarias.

Restricciones:

- Nunca al abrir la aplicación.
- Nunca inmediatamente después del login.
- Nunca dos veces seguidas.
- Nunca antes de completar una acción importante.

---

# Servicio sugerido

```typescript
AdsService
```

Métodos:

```typescript
puedeMostrarAds()

puedeMostrarInterstitial()

registrarImpresion()

registrarClick()

registrarCierre()
```

---

# Integración React Native sugerida

Librería sugerida:

react-native-google-mobile-ads

Repositorio oficial:

https://github.com/invertase/react-native-google-mobile-ads

---

# Configuración requerida

Android:

- App Id AdMob Android.
- Unit Id Banner.
- Unit Id Interstitial.

iOS:

- App Id AdMob iOS.
- Unit Id Banner.
- Unit Id Interstitial.

---

# Flujo Premium

Pantalla:

Eliminar anuncios.

Contenido:

"Disfruta MI-SAN sin anuncios por solo US$0.99."

Beneficios:

- Sin anuncios.
- Apoyo al desarrollo continuo.
- Experiencia más limpia.

Botones:

- Comprar Premium.
- Restaurar compras.

---

# Restauración de compras

Debe existir en ambas plataformas.

Obligatorio especialmente en iOS.

---

# Analíticas sugeridas

Eventos:

```text
trial_iniciado
trial_expirado
premium_comprado
premium_restaurado
pantalla_upgrade_abierta
banner_mostrado
banner_click
interstitial_mostrado
interstitial_click
```

---

# Métricas importantes

- Ingresos Ads.
- eCPM.
- CTR.
- Conversiones a Premium.
- Retención usuarios gratuitos.
- Retención usuarios Premium.

---

# Reglas UX obligatorias

✅ Priorizar experiencia del usuario.

✅ No saturar con anuncios.

✅ Permitir eliminar anuncios.

✅ Mantener tiempos de carga bajos.

❌ No utilizar anuncios engañosos.

❌ No utilizar anuncios que bloqueen operaciones importantes.

❌ No utilizar anuncios agresivos.

---

# Decisiones aprobadas

✅ AdMob como proveedor oficial.

✅ Banner discreto.

✅ Interstitial limitado.

✅ Premium elimina todos los anuncios.

✅ Sin Rewarded Ads en la V1.

✅ Sin App Open Ads en la V1.
