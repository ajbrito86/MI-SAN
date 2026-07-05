export function validarEnv(config: Record<string, unknown>) {
  const requeridas = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const faltantes = requeridas.filter((clave) => !config[clave]);

  if (faltantes.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${faltantes.join(', ')}`);
  }

  if (config.NODE_ENV === 'production') {
    const requeridasProduccion = ['GOOGLE_CLIENT_ID', 'GOOGLE_ANDROID_CLIENT_ID'].filter((clave) => !config[clave]);

    if (requeridasProduccion.length > 0) {
      throw new Error(`Variables de entorno faltantes para produccion: ${requeridasProduccion.join(', ')}`);
    }

    const secretosDebiles = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter((clave) => {
      const valor = String(config[clave] ?? '');
      return valor.length < 32 || valor.includes('dev_') || valor.includes('change_me');
    });

    if (secretosDebiles.length > 0) {
      throw new Error(`Secretos inseguros para produccion: ${secretosDebiles.join(', ')}`);
    }
  }

  return config;
}
