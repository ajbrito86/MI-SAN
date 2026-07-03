const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errores = [];
const avisos = [];
const esProduccion = process.env.NODE_ENV === 'production';

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

  const adsPlugin = appJson.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads');
  const adsConfig = adsPlugin?.[1];
  if (adsConfig?.androidAppId?.includes('3940256099942544') || adsConfig?.iosAppId?.includes('3940256099942544')) {
    const mensaje = 'AdMob usa App IDs de prueba. Cambiar antes de build comercial.';
    if (esProduccion) error(mensaje);
    else aviso(mensaje);
  } else {
    ok('AdMob App IDs no son los de prueba oficiales.');
  }
}

function validarDocs() {
  [
    'docs_first_deploy/store-metadata-mi-san.md',
    'docs_first_deploy/assets-exportados-mi-san.md',
    'docs_first_deploy/release-readiness-mi-san.md',
    'docs_first_deploy/data-safety-google-play-mi-san.md',
    'docs_first_deploy/app-privacy-apple-mi-san.md',
    'docs_first_deploy/configuracion-global-operativa-mi-san.md',
    'docs_first_deploy/admob-real-checklist-mi-san.md',
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
  const mobileEnv = fs.readFileSync(path.join(root, 'apps/mobile/.env.example'), 'utf8');
  if (mobileEnv.includes('EXPO_PUBLIC_API_BASE_URL=')) ok('EXPO_PUBLIC_API_BASE_URL documentado.');
  else error('Falta EXPO_PUBLIC_API_BASE_URL en apps/mobile/.env.example.');

  const envApiUrl = extraerEnv(mobileEnv, 'EXPO_PUBLIC_API_BASE_URL');
  if (envApiUrl) validarApiUrlSegura(envApiUrl, 'apps/mobile/.env.example');

  const eas = leerJson('apps/mobile/eas.json');
  for (const [perfil, config] of Object.entries(eas.build ?? {})) {
    const url = config?.env?.EXPO_PUBLIC_API_BASE_URL;
    if (url) validarApiUrlSegura(url, `apps/mobile/eas.json:${perfil}`);
    else aviso(`El perfil EAS ${perfil} no define EXPO_PUBLIC_API_BASE_URL.`);
  }

  validarAdMobUnits(mobileEnv);
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

function validarAdMobUnits(mobileEnv) {
  const claves = [
    'EXPO_PUBLIC_ADMOB_BANNER_ANDROID',
    'EXPO_PUBLIC_ADMOB_BANNER_IOS',
    'EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID',
    'EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS',
  ];

  for (const clave of claves) {
    const valor = extraerEnv(mobileEnv, clave);
    if (!valor) {
      error(`Falta ${clave} en apps/mobile/.env.example.`);
      continue;
    }

    const usaPlaceholder = valor.includes('xxxxxxxx') || valor.includes('yyyyyyyy') || valor.includes('3940256099942544');
    if (usaPlaceholder) {
      const mensaje = `${clave} usa placeholder/test id.`;
      if (esProduccion) error(mensaje);
      else aviso(mensaje);
    } else {
      ok(`${clave} parece configurado.`);
    }
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
