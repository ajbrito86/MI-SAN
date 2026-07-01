export function etiquetaEstadoSociedad(estado: string) {
  if (estado === 'CANCELADA') {
    return 'CERRADA';
  }

  return estado;
}
