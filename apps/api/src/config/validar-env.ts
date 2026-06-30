export function validarEnv(config: Record<string, unknown>) {
  const requeridas = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const faltantes = requeridas.filter((clave) => !config[clave]);

  if (faltantes.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${faltantes.join(', ')}`);
  }

  return config;
}
