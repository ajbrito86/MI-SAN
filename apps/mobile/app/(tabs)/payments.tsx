import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { etiquetaEstadoOperativo } from '@/lib/estados';
import { formatearMonto } from '@/lib/moneda';
import { getPublicFileUrl } from '@/services/api';
import { subirEvidenciaPago, type ArchivoEvidencia } from '@/services/evidencias-service';
import { listarMisPagos, type MetodoPago, type Pago, reportarPago } from '@/services/pagos-service';
import { useAuthStore } from '@/stores/auth-store';

const METODOS: { valor: MetodoPago; etiqueta: string; requiereComprobante: boolean }[] = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo', requiereComprobante: false },
  { valor: 'DEPOSITO_BANCARIO', etiqueta: 'Deposito', requiereComprobante: true },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia', requiereComprobante: true },
];

export default function Pagos() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pagoActivo, setPagoActivo] = useState<string | null>(null);
  const [comprobanteActivo, setComprobanteActivo] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [archivo, setArchivo] = useState<ArchivoEvidencia | null>(null);
  const [archivoComprobante, setArchivoComprobante] = useState<ArchivoEvidencia | null>(null);

  const { data: pagos = [] } = useQuery({
    queryKey: ['mis-pagos'],
    queryFn: () => listarMisPagos(token ?? ''),
    enabled: Boolean(token),
  });

  const metodoSeleccionado = METODOS.find((metodo) => metodo.valor === metodoPago) ?? METODOS[0];
  const pagosPorHacer = pagos.filter((pago) => ['PENDIENTE', 'ATRASADO', 'RECHAZADO'].includes(pago.estado));
  const pagosEnRevision = pagos.filter((pago) => pago.estado === 'REPORTADO');
  const pagosHistorial = pagos.filter((pago) => ['CONFIRMADO', 'INCUMPLIDO', 'CANCELADO'].includes(pago.estado));
  const totalPagado = pagos.filter((pago) => pago.estado === 'CONFIRMADO').reduce((total, pago) => total + pago.monto, 0);
  const totalDebe = pagosPorHacer.reduce((total, pago) => total + pago.monto, 0);

  const seleccionarArchivo = async (onSelect: (archivo: ArchivoEvidencia) => void) => {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (resultado.canceled) {
      return;
    }

    const elegido = resultado.assets[0];
    onSelect({
      uri: elegido.uri,
      name: elegido.name,
      mimeType: elegido.mimeType,
    });
  };

  const reportarMutation = useMutation({
    mutationFn: async (cuotaPagoId: string) => {
      if (metodoSeleccionado.requiereComprobante && !archivo) {
        throw new Error('Debes adjuntar un comprobante para deposito o transferencia.');
      }

      if (archivo) {
        await subirEvidenciaPago(token ?? '', cuotaPagoId, archivo);
      }

      await reportarPago(token ?? '', cuotaPagoId, metodoPago);
    },
    onSuccess: async () => {
      setMensaje('Pago enviado al organizador para revision.');
      setPagoActivo(null);
      setMetodoPago('EFECTIVO');
      setArchivo(null);
      await queryClient.invalidateQueries({ queryKey: ['mis-pagos'] });
    },
    onError: (error) => setMensaje(error instanceof Error ? error.message : 'No pudimos reportar el pago.'),
  });

  const adjuntarComprobanteMutation = useMutation({
    mutationFn: async (cuotaPagoId: string) => {
      if (!archivoComprobante) {
        throw new Error('Debes elegir el comprobante antes de adjuntarlo.');
      }

      await subirEvidenciaPago(token ?? '', cuotaPagoId, archivoComprobante);
    },
    onSuccess: async () => {
      setMensaje('Comprobante adjuntado. El organizador ya puede revisarlo.');
      setComprobanteActivo(null);
      setArchivoComprobante(null);
      await queryClient.invalidateQueries({ queryKey: ['mis-pagos'] });
    },
    onError: (error) => setMensaje(error instanceof Error ? error.message : 'No pudimos adjuntar el comprobante.'),
  });

  const iniciarReporte = (cuotaPagoId: string) => {
    setMensaje(null);
    setArchivo(null);
    setMetodoPago('EFECTIVO');
    setPagoActivo(cuotaPagoId);
    setComprobanteActivo(null);
    setArchivoComprobante(null);
  };

  const iniciarAdjuntoComprobante = (cuotaPagoId: string) => {
    setMensaje(null);
    setPagoActivo(null);
    setArchivo(null);
    setComprobanteActivo(cuotaPagoId);
    setArchivoComprobante(null);
  };

  const renderPago = (pago: Pago) => {
    const puedeReportar = ['PENDIENTE', 'ATRASADO', 'RECHAZADO'].includes(pago.estado);
    const estaActivo = pagoActivo === pago.id;
    const adjuntoActivo = comprobanteActivo === pago.id;
    const requiereComprobantePendiente =
      pago.estado === 'REPORTADO' && pago.metodoPagoReportado !== null && pago.metodoPagoReportado !== 'EFECTIVO' && pago.evidencias.length === 0;

    return (
      <View key={pago.id} className="gap-2 rounded-lg bg-white p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-semibold text-marca-texto">
              {pago.sociedad.nombre} - cuota #{pago.numeroCuota} ciclo #{pago.ciclo.numeroCiclo}
            </Text>
            <Text className="mt-1 text-slate-600">
              {formatearMonto(pago.monto, pago.sociedad.moneda)} vence {new Date(pago.fechaVencimiento).toLocaleDateString()}
            </Text>
          </View>
          <BadgePago estado={pago.estado} />
        </View>

        {pago.estado === 'RECHAZADO' && pago.observacion ? (
          <Text className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">Motivo: {pago.observacion}</Text>
        ) : null}

        {pago.estado === 'REPORTADO' ? (
          <Text className="rounded-lg bg-blue-50 p-3 text-sm font-semibold text-marca-azul">
            {requiereComprobantePendiente
              ? 'Este pago necesita comprobante para que el organizador pueda confirmarlo.'
              : 'Este pago esta en revision del organizador.'}
          </Text>
        ) : null}

        {pago.metodoPagoReportado ? (
          <Text className="text-sm font-semibold text-slate-600">Metodo reportado: {etiquetaMetodo(pago.metodoPagoReportado)}</Text>
        ) : null}

        {puedeReportar && !estaActivo ? (
          <AppButton titulo={pago.estado === 'RECHAZADO' ? 'Reportar nuevamente' : 'Hacer pago'} onPress={() => iniciarReporte(pago.id)} />
        ) : null}

        {puedeReportar && estaActivo ? (
          <View className="gap-3 rounded-lg bg-slate-50 p-4">
            <Text className="text-base font-semibold text-marca-texto">Metodo de pago</Text>
            <View className="flex-row flex-wrap gap-2">
              {METODOS.map((metodo) => {
                const activo = metodo.valor === metodoPago;
                return (
                  <Pressable
                    key={metodo.valor}
                    className={`rounded-lg border px-3 py-3 ${activo ? 'border-marca-verde bg-emerald-50' : 'border-slate-200 bg-white'}`}
                    onPress={() => {
                      setMetodoPago(metodo.valor);
                      if (!metodo.requiereComprobante) {
                        setArchivo(null);
                      }
                    }}
                  >
                    <Text className={`text-sm font-semibold ${activo ? 'text-marca-verde' : 'text-slate-600'}`}>{metodo.etiqueta}</Text>
                  </Pressable>
                );
              })}
            </View>

            {metodoSeleccionado.requiereComprobante ? (
              <View className="gap-2">
                <AppButton
                  titulo={archivo ? 'Cambiar comprobante' : 'Adjuntar comprobante'}
                  variante="secundario"
                  onPress={() => seleccionarArchivo(setArchivo)}
                />
                {archivo ? <Text className="text-sm font-semibold text-slate-600">{archivo.name}</Text> : null}
              </View>
            ) : (
              <Text className="text-sm text-slate-600">El pago en efectivo no requiere comprobante.</Text>
            )}

            <View className="gap-2">
              <AppButton
                titulo={reportarMutation.isPending ? 'Enviando...' : 'Enviar pago'}
                onPress={() => reportarMutation.mutate(pago.id)}
                disabled={reportarMutation.isPending}
              />
              <AppButton titulo="Cancelar" variante="secundario" onPress={() => setPagoActivo(null)} disabled={reportarMutation.isPending} />
            </View>
          </View>
        ) : null}

        {requiereComprobantePendiente && !adjuntoActivo ? (
          <AppButton titulo="Adjuntar comprobante pendiente" variante="secundario" onPress={() => iniciarAdjuntoComprobante(pago.id)} />
        ) : null}

        {requiereComprobantePendiente && adjuntoActivo ? (
          <View className="gap-3 rounded-lg bg-amber-50 p-4">
            <Text className="text-base font-semibold text-marca-texto">Comprobante pendiente</Text>
            <Text className="text-sm text-slate-600">Adjunta la evidencia para que el organizador pueda confirmar este pago.</Text>
            <AppButton
              titulo={archivoComprobante ? 'Cambiar comprobante' : 'Elegir comprobante'}
              variante="secundario"
              onPress={() => seleccionarArchivo(setArchivoComprobante)}
            />
            {archivoComprobante ? <Text className="text-sm font-semibold text-slate-600">{archivoComprobante.name}</Text> : null}
            <View className="gap-2">
              <AppButton
                titulo={adjuntarComprobanteMutation.isPending ? 'Adjuntando...' : 'Adjuntar'}
                onPress={() => adjuntarComprobanteMutation.mutate(pago.id)}
                disabled={adjuntarComprobanteMutation.isPending}
              />
              <AppButton
                titulo="Cancelar"
                variante="secundario"
                onPress={() => setComprobanteActivo(null)}
                disabled={adjuntarComprobanteMutation.isPending}
              />
            </View>
          </View>
        ) : null}

        {pago.evidencias.length > 0 ? (
          <View className="rounded-lg bg-slate-50 p-3">
            <Text className="text-sm font-semibold text-marca-texto">Comprobantes</Text>
            {pago.evidencias.map((evidencia) => (
              <Text
                key={evidencia.id}
                className="mt-2 text-sm font-semibold text-marca-azul"
                onPress={() => Linking.openURL(getPublicFileUrl(evidencia.urlArchivo))}
              >
                {evidencia.nombreArchivo}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenScrollView>
      <AppHeader titulo="Pagos" subtitulo="Reporta tus cuotas y consulta su estado" />
      <View className="mt-5 gap-4 pb-24">
        {mensaje ? <Text className="rounded-lg bg-white p-3 text-sm font-semibold text-marca-verde">{mensaje}</Text> : null}
        {pagos.length === 0 ? (
          <AppCard titulo="Sin cuotas" detalle="Cuando inicie un ciclo veras tus cuotas aqui." estado="AL DIA" />
        ) : (
          <>
            <View className="rounded-lg bg-white p-4">
              <Text className="text-lg font-semibold text-marca-texto">Resumen</Text>
              <View className="mt-3 flex-row gap-3">
                <View className="flex-1 rounded-lg bg-emerald-50 p-3">
                  <Text className="text-xs font-bold uppercase text-marca-verde">Pagado</Text>
                  <Text className="mt-1 font-semibold text-marca-texto">{formatearMonto(totalPagado, pagos[0]?.sociedad.moneda)}</Text>
                </View>
                <View className="flex-1 rounded-lg bg-amber-50 p-3">
                  <Text className="text-xs font-bold uppercase text-amber-700">Por pagar</Text>
                  <Text className="mt-1 font-semibold text-marca-texto">{formatearMonto(totalDebe, pagos[0]?.sociedad.moneda)}</Text>
                </View>
              </View>
            </View>

            <SeccionPagos titulo="Por pagar" vacio="No tienes cuotas pendientes." pagos={pagosPorHacer} renderPago={renderPago} />
            <SeccionPagos titulo="En revision" vacio="No tienes pagos esperando revision." pagos={pagosEnRevision} renderPago={renderPago} />
            <SeccionPagos titulo="Historial" vacio="Aun no tienes pagos confirmados o cerrados." pagos={pagosHistorial} renderPago={renderPago} />
          </>
        )}
      </View>
    </ScreenScrollView>
  );
}

function etiquetaMetodo(metodo: string) {
  return METODOS.find((item) => item.valor === metodo)?.etiqueta ?? metodo;
}

function SeccionPagos({
  titulo,
  vacio,
  pagos,
  renderPago,
}: {
  titulo: string;
  vacio: string;
  pagos: Pago[];
  renderPago: (pago: Pago) => React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text className="text-base font-bold text-marca-texto">{titulo}</Text>
      {pagos.length === 0 ? <Text className="rounded-lg bg-white p-4 text-slate-600">{vacio}</Text> : pagos.map(renderPago)}
    </View>
  );
}

function BadgePago({ estado }: { estado: string }) {
  const estilo = estilosEstadoPago(estado);

  return <Text className={`rounded-full px-3 py-1 text-xs font-bold ${estilo}`}>{etiquetaEstadoOperativo(estado)}</Text>;
}

function estilosEstadoPago(estado: string) {
  switch (estado) {
    case 'PENDIENTE':
      return 'bg-amber-50 text-amber-700';
    case 'REPORTADO':
      return 'bg-blue-50 text-marca-azul';
    case 'CONFIRMADO':
      return 'bg-emerald-50 text-marca-verde';
    case 'ATRASADO':
      return 'bg-orange-50 text-orange-700';
    case 'INCUMPLIDO':
    case 'CANCELADO':
    case 'RECHAZADO':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}
