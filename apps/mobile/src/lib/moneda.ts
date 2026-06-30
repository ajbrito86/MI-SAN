export type Moneda = 'DOP' | 'USD';

export function formatearMonto(monto: number, moneda: string = 'DOP') {
  const simbolo = moneda === 'USD' ? 'US$' : 'RD$';
  return `${simbolo} ${monto.toLocaleString()}`;
}
