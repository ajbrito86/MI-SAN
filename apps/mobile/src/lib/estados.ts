export function etiquetaEstadoSociedad(estado: string) {
  if (estado === 'CANCELADA') {
    return 'CERRADA';
  }

  return estado;
}

export function etiquetaEstadoOperativo(estado: string) {
  if (estado === 'CANCELADO') {
    return 'CERRADO';
  }

  return estado;
}
