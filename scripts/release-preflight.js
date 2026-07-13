const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errores = [];
const avisos = [];
const esProduccion = process.env.NODE_ENV === 'production';
const ADMOB_ANDROID_KEYS = ['ADMOB_ANDROID_APP_ID', 'ADMOB_ANDROID_BANNER_ID', 'ADMOB_ANDROID_INTERSTITIAL_ID'];
const ADMOB_IOS_KEYS = ['ADMOB_IOS_APP_ID', 'ADMOB_IOS_BANNER_ID', 'ADMOB_IOS_INTERSTITIAL_ID'];

function existe(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function leerJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

function ok(mensaje) {
  console.log(`[OK] ${mensaje}`);
}

function error(mensaje) {
  errores.push(mensaje);
  console.log(`[ERROR] ${mensaje}`);
}

function aviso(mensaje) {
  avisos.push(mensaje);
  console.log(`[AVISO] ${mensaje}`);
}

function validarArchivo(relPath) {
  if (existe(relPath)) {
    ok(`Existe ${relPath}`);
  } else {
    error(`Falta ${relPath}`);
  }
}

function leerDimensionesPng(relPath) {
  const buffer = fs.readFileSync(path.join(root, relPath));
  const firmaPng = buffer.slice(0, 8).toString('hex');

  if (firmaPng !== '89504e470d0a1a0a') {
    throw new Error(`${relPath} no parece ser PNG valido.`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function validarPng(relPath, width, height) {
  try {
    const dimensiones = leerDimensionesPng(relPath);
    if (dimensiones.width === width && dimensiones.height === height) {
      ok(`${relPath} tiene ${width}x${height}`);
    } else {
      error(`${relPath} tiene ${dimensiones.width}x${dimensiones.height}; esperado ${width}x${height}`);
    }
  } catch (err) {
    error(err instanceof Error ? err.message : `No se pudo leer ${relPath}`);
  }
}

function listarArchivos(dirRel, extensiones) {
  const dirAbs = path.join(root, dirRel);
  if (!fs.existsSync(dirAbs)) {
    return [];
  }

  return fs.readdirSync(dirAbs, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dirRel, entry.name);
    if (entry.isDirectory() && ['node_modules', '.expo', 'dist', 'build'].includes(entry.name)) {
      return [];
    }

    if (entry.isDirectory()) {
      return listarArchivos(rel, extensiones);
    }

    return extensiones.includes(path.extname(entry.name)) ? [rel] : [];
  });
}

function validarSinConsoleInnecesario() {
  const archivos = [...listarArchivos('apps/api/src', ['.ts']), ...listarArchivos('apps/mobile', ['.ts', '.tsx'])];
  const hallazgos = [];

  for (const relPath of archivos) {
    const contenido = fs.readFileSync(path.join(root, relPath), 'utf8');
    if (/console\.(log|warn|error)/.test(contenido)) {
      hallazgos.push(relPath);
    }
  }

  if (hallazgos.length === 0) {
    ok('Sin console.log/warn/error innecesarios en src/app movil.');
  } else {
    error(`Hay console.* en archivos de runtime: ${hallazgos.join(', ')}`);
  }
}

function validarAppJson() {
  const appJson = leerJson('apps/mobile/app.json').expo;
  if (appJson.version === '1.0.0') ok('Version mobile 1.0.0 configurada.');
  else error(`Version mobile inesperada: ${appJson.version}`);

  if (appJson.android?.versionCode === 1) ok('Android versionCode 1 configurado.');
  else error('Android versionCode inicial no esta configurado en 1.');

  if (appJson.ios?.buildNumber === '1') ok('iOS buildNumber 1 configurado.');
  else error('iOS buildNumber inicial no esta configurado en 1.');

  validarArchivo(appJson.icon.replace('./', 'apps/mobile/'));
  validarArchivo(appJson.splash.image.replace('./', 'apps/mobile/'));
  validarArchivo(appJson.android.adaptiveIcon.foregroundImage.replace('./', 'apps/mobile/'));

  validarArchivo('apps/mobile/app.config.js');
  const appJsonRaw = fs.readFileSync(path.join(root, 'apps/mobile/app.json'), 'utf8');
  if (appJsonRaw.includes('ca-app-pub-')) {
    error('apps/mobile/app.json no debe hardcodear IDs de AdMob; usar variables de entorno en app.config.js.');
  } else {
    ok('AdMob App IDs se resuelven por variables de entorno en app.config.js.');
  }
}

function validarDocs() {
  [
    'compose.production.yml',
    'deploy-prod.sh',
    'backup-db.sh',
    'restore-db.sh',
    'docs_first_deploy/store-metadata-mi-san.md',
    'docs_first_deploy/assets-exportados-mi-san.md',
    'docs_first_deploy/release-readiness-mi-san.md',
    'docs_first_deploy/data-safety-google-play-mi-san.md',
    'docs_first_deploy/app-privacy-apple-mi-san.md',
    'docs_first_deploy/configuracion-global-operativa-mi-san.md',
    'docs_first_deploy/admob-real-checklist-mi-san.md',
    'docs_first_deploy/admob-real-values-mi-san.md',
    'docs_first_deploy/billing-real-checklist-mi-san.md',
    'docs_first_deploy/build-production-guide-mi-san.md',
    'docs_first_deploy/environments-dev-staging-production-mi-san.md',
    'docs_first_deploy/backup-restore-basic-mi-san.md',
  ].forEach(validarArchivo);
}

function validarAssets() {
  validarPng('apps/mobile/assets/icon.png', 1024, 1024);
  validarPng('apps/mobile/assets/adaptive-icon.png', 1024, 1024);
  validarPng('apps/mobile/assets/splash-icon.png', 512, 512);
  validarPng('apps/mobile/assets/favicon.png', 512, 512);
  validarPng('apps/mobile/assets/store/feature-graphic.png', 1024, 500);
  validarPng('apps/mobile/assets/store/social-square.png', 1080, 1080);
  validarPng('apps/mobile/assets/store/social-story.png', 1080, 1920);
}

function validarScripts() {
  const pkg = leerJson('package.json');
  [
    'api:build',
    'api:prisma:generate',
    'lint',
    'typecheck',
    'test',
    'mobile:build:android',
    'mobile:build:ios',
    'release:preflight',
  ].forEach((script) => {
    if (pkg.scripts?.[script]) ok(`Script ${script} configurado.`);
    else error(`Falta script ${script}.`);
  });
}

function validarEnv() {
  validarArchivo('apps/api/.env.production.example');
  validarArchivo('apps/mobile/.env.example');
  validarArchivo('apps/mobile/.env.production.example');
  const apiProductionEnvExample = fs.readFileSync(path.join(root, 'apps/api/.env.production.example'), 'utf8');
  const mobileEnv = fs.readFileSync(path.join(root, 'apps/mobile/.env.example'), 'utf8');
  const mobileProductionEnv = fs.readFileSync(path.join(root, 'apps/mobile/.env.production.example'), 'utf8');
  validarBillingEnv(apiProductionEnvExample, 'apps/api/.env.production.example');
  if (mobileEnv.includes('EXPO_PUBLIC_API_BASE_URL=')) ok('EXPO_PUBLIC_API_BASE_URL documentado.');
  else error('Falta EXPO_PUBLIC_API_BASE_URL en apps/mobile/.env.example.');

  const envApiUrl = extraerEnv(mobileEnv, 'EXPO_PUBLIC_API_BASE_URL');
  if (envApiUrl) validarApiUrlSegura(envApiUrl, 'apps/mobile/.env.example');

  const eas = leerJson('apps/mobile/eas.json');
  for (const [perfil, config] of Object.entries(eas.build ?? {})) {
    const url = config?.env?.EXPO_PUBLIC_API_BASE_URL;
    if (url) validarApiUrlSegura(url, `apps/mobile/eas.json:${perfil}`);
    else aviso(`El perfil EAS ${perfil} no define EXPO_PUBLIC_API_BASE_URL.`);

    const nativeAds = config?.env?.EXPO_PUBLIC_ENABLE_NATIVE_ADS;
    if (nativeAds === 'true') {
      ok(`El perfil EAS ${perfil} habilita anuncios nativos.`);
    } else {
      const mensaje = `El perfil EAS ${perfil} debe definir EXPO_PUBLIC_ENABLE_NATIVE_ADS=true para probar AdMob en builds nativos.`;
      if (esProduccion) error(mensaje);
      else aviso(mensaje);
    }

    validarAdsTestModePerfil(perfil, config?.env ?? {});
    validarBillingMobileEnvDesdeObjeto(config?.env ?? {}, `apps/mobile/eas.json:${perfil}`, { estricto: esProduccion });
    validarAdMobEnvDesdeObjeto(config?.env ?? {}, `apps/mobile/eas.json:${perfil}`, ADMOB_ANDROID_KEYS, {
      estricto: esProduccion,
    });
  }

  validarBillingMobileEnv(mobileEnv, 'apps/mobile/.env.example');
  validarBillingMobileEnv(mobileProductionEnv, 'apps/mobile/.env.production.example');
  validarAdMobEnv(mobileEnv, 'apps/mobile/.env.example');
  validarAdMobEnv(mobileProductionEnv, 'apps/mobile/.env.production.example');

  if (esProduccion) {
    const apiEnvProduccionRel = 'apps/api/.env.production';
    if (!existe(apiEnvProduccionRel)) {
      aviso(`No se encontro ${apiEnvProduccionRel}; no se pudo validar Billing productivo local.`);
    } else {
      const apiProductionRealEnv = fs.readFileSync(path.join(root, apiEnvProduccionRel), 'utf8');
      validarBillingEnv(apiProductionRealEnv, apiEnvProduccionRel, { estricto: true });
    }

    const envProduccionRel = 'apps/mobile/.env.production';
    if (!existe(envProduccionRel)) {
      error(`Falta ${envProduccionRel} con IDs reales de AdMob Android para preflight estricto.`);
    } else {
      const mobileProductionRealEnv = fs.readFileSync(path.join(root, envProduccionRel), 'utf8');
      validarNativeAdsProduccion(mobileProductionRealEnv, envProduccionRel);
      validarAdsTestModeProduccion(mobileProductionRealEnv, envProduccionRel);
      validarBillingMobileEnv(mobileProductionRealEnv, envProduccionRel, { estricto: true });
      validarAdMobEnv(mobileProductionRealEnv, envProduccionRel, { estricto: true, claves: ADMOB_ANDROID_KEYS });
      validarAdMobEnv(mobileProductionRealEnv, envProduccionRel, { claves: ADMOB_IOS_KEYS, prefijoAviso: 'Fase iOS posterior' });
    }
  }
}

function validarBillingEnv(apiEnv, origen, opciones = {}) {
  const billingReal = extraerEnv(apiEnv, 'BILLING_REAL_ENABLED');
  const manualPremium = extraerEnv(apiEnv, 'ALLOW_MANUAL_PREMIUM_ACTIVATION');
  const premiumProductId = extraerEnv(apiEnv, 'PREMIUM_PRODUCT_ID');
  const packageName = extraerEnv(apiEnv, 'GOOGLE_PLAY_PACKAGE_NAME');
  const productId = premiumProductId || extraerEnv(apiEnv, 'GOOGLE_PLAY_PREMIUM_PRODUCT_ID');
  const serviceAccount = extraerEnv(apiEnv, 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64');
  const appStoreBundleId = extraerEnv(apiEnv, 'APP_STORE_BUNDLE_ID');

  if (billingReal === null) {
    const mensaje = `Falta BILLING_REAL_ENABLED en ${origen}.`;
    if (opciones.estricto) error(mensaje);
    else aviso(mensaje);
  } else if (billingReal === 'true') {
    aviso(`${origen} declara Billing real activo; confirmar que Google Play Billing y App Store validan compras en backend.`);
    validarBillingRealTiendas(packageName, productId, serviceAccount, appStoreBundleId, origen, opciones);
  } else {
    ok(`${origen} mantiene Billing real desactivado.`);
  }

  if (manualPremium === null) {
    const mensaje = `Falta ALLOW_MANUAL_PREMIUM_ACTIVATION en ${origen}.`;
    if (opciones.estricto) error(mensaje);
    else aviso(mensaje);
  } else if (manualPremium === 'true') {
    const mensaje = `${origen} permite activacion manual de Premium.`;
    if (opciones.estricto) error(`${mensaje} Desactivar antes de release comercial.`);
    else aviso(mensaje);
  } else {
    ok(`${origen} bloquea activacion manual de Premium.`);
  }
}

function validarBillingRealTiendas(packageName, productId, serviceAccount, appStoreBundleId, origen, opciones = {}) {
  const faltantes = [];
  if (!packageName) faltantes.push('GOOGLE_PLAY_PACKAGE_NAME');
  if (!productId) faltantes.push('PREMIUM_PRODUCT_ID');
  if (!serviceAccount) faltantes.push('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64');
  if (!appStoreBundleId) faltantes.push('APP_STORE_BUNDLE_ID');

  if (faltantes.length > 0) {
    const mensaje = `${origen} habilita Billing real pero faltan: ${faltantes.join(', ')}.`;
    if (opciones.estricto) error(mensaje);
    else aviso(mensaje);
    return;
  }

  if (packageName !== 'app.mi_san.mobile') {
    error(`${origen} debe usar GOOGLE_PLAY_PACKAGE_NAME=app.mi_san.mobile.`);
  } else {
    ok(`${origen} usa package Android esperado para Billing.`);
  }

  if (productId !== 'premium_sin_ads') {
    error(`${origen} debe usar PREMIUM_PRODUCT_ID=premium_sin_ads.`);
  } else {
    ok(`${origen} usa producto Premium esperado para Billing.`);
  }

  if (appStoreBundleId !== 'app.mi-san.mobile') {
    error(`${origen} debe usar APP_STORE_BUNDLE_ID=app.mi-san.mobile.`);
  } else {
    ok(`${origen} usa bundle iOS esperado para Billing.`);
  }
}

function validarBillingMobileEnv(mobileEnv, origen, opciones = {}) {
  validarBillingMobileValores(
    extraerEnv(mobileEnv, 'EXPO_PUBLIC_ENABLE_NATIVE_BILLING'),
    extraerEnv(mobileEnv, 'EXPO_PUBLIC_PREMIUM_PRODUCT_ID') || extraerEnv(mobileEnv, 'EXPO_PUBLIC_GOOGLE_PLAY_PREMIUM_PRODUCT_ID'),
    origen,
    opciones,
  );
}

function validarBillingMobileEnvDesdeObjeto(envObj, origen, opciones = {}) {
  validarBillingMobileValores(
    extraerEnvObjeto(envObj, 'EXPO_PUBLIC_ENABLE_NATIVE_BILLING'),
    extraerEnvObjeto(envObj, 'EXPO_PUBLIC_PREMIUM_PRODUCT_ID') || extraerEnvObjeto(envObj, 'EXPO_PUBLIC_GOOGLE_PLAY_PREMIUM_PRODUCT_ID'),
    origen,
    opciones,
  );
}

function validarBillingMobileValores(nativeBilling, productId, origen, opciones = {}) {
  if (nativeBilling === null) {
    aviso(`Falta EXPO_PUBLIC_ENABLE_NATIVE_BILLING en ${origen}.`);
  } else if (nativeBilling === 'true') {
    ok(`${origen} habilita Billing nativo.`);
  } else if (opciones.estricto) {
    error(`${origen} debe definir EXPO_PUBLIC_ENABLE_NATIVE_BILLING=true para builds comerciales Android.`);
  } else {
    aviso(`${origen} mantiene Billing nativo desactivado.`);
  }

  if (!productId) {
    const mensaje = `Falta EXPO_PUBLIC_PREMIUM_PRODUCT_ID en ${origen}.`;
    if (opciones.estricto) error(mensaje);
    else aviso(mensaje);
  } else if (productId !== 'premium_sin_ads') {
    aviso(`${origen} usa Product ID Premium inesperado: ${productId}.`);
  } else {
    ok(`${origen} declara Product ID premium_sin_ads.`);
  }
}

function extraerEnv(contenido, clave) {
  const linea = contenido
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${clave}=`));

  return linea ? linea.slice(clave.length + 1).trim() : null;
}

function validarApiUrlSegura(url, origen) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    error(`${origen} contiene una URL invalida: ${url}`);
    return;
  }

  const host = parsed.hostname;
  const esLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(host);
  const esPrivada =
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === '::1';

  if (parsed.protocol !== 'https:') {
    error(`${origen} debe usar HTTPS: ${url}`);
  } else if (esLocalhost || esPrivada) {
    error(`${origen} no puede apuntar a localhost/IP privada: ${url}`);
  } else {
    ok(`${origen} usa API publica HTTPS.`);
  }
}

function validarNativeAdsProduccion(mobileEnv, origen) {
  const nativeAds = extraerEnv(mobileEnv, 'EXPO_PUBLIC_ENABLE_NATIVE_ADS');

  if (nativeAds === 'true') {
    ok(`${origen} habilita anuncios nativos.`);
  } else {
    error(`${origen} debe definir EXPO_PUBLIC_ENABLE_NATIVE_ADS=true para probar AdMob Android real.`);
  }
}

function validarAdsTestModePerfil(perfil, envObj) {
  const testMode = extraerEnvObjeto(envObj, 'EXPO_PUBLIC_ADS_TEST_MODE');
  const buildProfile = extraerEnvObjeto(envObj, 'EXPO_PUBLIC_BUILD_PROFILE');

  if (buildProfile !== perfil) {
    const mensaje = `apps/mobile/eas.json:${perfil} debe definir EXPO_PUBLIC_BUILD_PROFILE=${perfil}.`;
    if (esProduccion) error(mensaje);
    else aviso(mensaje);
  }

  if (perfil === 'production' && testMode === 'true') {
    error('EXPO_PUBLIC_ADS_TEST_MODE no puede estar activo en apps/mobile/eas.json:production.');
  } else if (['internal', 'preview'].includes(perfil) && testMode === 'true') {
    ok(`El perfil EAS ${perfil} habilita modo de prueba de anuncios.`);
  } else if (perfil !== 'production') {
    aviso(`El perfil EAS ${perfil} no tiene EXPO_PUBLIC_ADS_TEST_MODE=true; los usuarios Premium no veran anuncios de prueba.`);
  }
}

function validarAdsTestModeProduccion(mobileEnv, origen) {
  const testMode = extraerEnv(mobileEnv, 'EXPO_PUBLIC_ADS_TEST_MODE');
  const buildProfile = extraerEnv(mobileEnv, 'EXPO_PUBLIC_BUILD_PROFILE');

  if (testMode === 'true' || buildProfile === 'preview' || buildProfile === 'internal') {
    error(`${origen} no debe activar modo de prueba de anuncios para produccion.`);
  }
}

function extraerEnvObjeto(envObj, clave) {
  const valor = envObj[clave];
  return typeof valor === 'string' ? valor.trim() : null;
}

function validarAdMobEnvDesdeObjeto(envObj, origen, claves, opciones = {}) {
  for (const clave of claves) {
    const valor = extraerEnvObjeto(envObj, clave);
    validarAdMobValor(clave, valor, origen, opciones);
  }
}

function validarAdMobEnv(mobileEnv, origen, opciones = {}) {
  const claves = opciones.claves ?? [...ADMOB_ANDROID_KEYS, ...ADMOB_IOS_KEYS];

  for (const clave of claves) {
    const valor = extraerEnv(mobileEnv, clave);
    validarAdMobValor(clave, valor, origen, opciones);
  }
}

function validarAdMobValor(clave, valor, origen, opciones = {}) {
  if (!valor) {
    const mensaje = `Falta ${clave} en ${origen}.`;
    if (opciones.estricto) error(mensaje);
    else aviso(mensaje);
    return;
  }

  const usaPlaceholder =
    valor.includes('replace_with_') ||
    valor.includes('xxxxxxxx') ||
    valor.includes('yyyyyyyy') ||
    valor.includes('3940256099942544');
  if (usaPlaceholder) {
    const mensaje = `${clave} usa placeholder/test id en ${origen}.`;
    if (opciones.estricto) error(`Produccion pendiente: ${mensaje}`);
    else aviso(`${opciones.prefijoAviso ?? 'Pendiente'}: ${mensaje}`);
  } else {
    ok(`${clave} parece configurado en ${origen}.`);
  }
}

console.log('Preflight release MI-SAN');
console.log('========================');

validarAppJson();
validarAssets();
validarDocs();
validarScripts();
validarEnv();
validarSinConsoleInnecesario();

console.log('');
console.log(`Resultado: ${errores.length} error(es), ${avisos.length} aviso(s).`);

if (errores.length > 0) {
  process.exit(1);
}
