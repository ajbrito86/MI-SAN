import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from 'expo-router';
import { CreditCard, Wallet } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { useConfiguracionMobile } from '@/hooks/use-configuracion-mobile';
import { useSuscripcion } from '@/hooks/use-suscripcion';
import { etiquetaEstadoOperativo } from '@/lib/estados';
import { formatearMonto } from '@/lib/moneda';
import { mostrarInterstitialPagoCuota } from '@/services/ads-service';
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
  const { data: configuracion } = useConfiguracionMobile();
  const { data: suscripcion } = useSuscripcion();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pagoActivo, setPagoActivo] = useState<string | null>(null);
  const [comprobanteActivo, setComprobanteActivo] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [archivo, setArchivo] = useState<ArchivoEvidencia | null>(null);
  const [archivoComprobante, setArchivoComprobante] = useState<ArchivoEvidencia | null>(null);
  const [sociedadFiltroId, setSociedadFiltroId] = useState<string>('TODAS');

  const { data: pagos = [], refetch: recargarPagos } = useQuery({
    queryKey: ['mis-pagos'],
    queryFn: () => listarMisPagos(token ?? ''),
    enabled: Boolean(token),
  });

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void recargarPagos();
      }
    }, [recargarPagos, token]),
  );

  const metodoSeleccionado = METODOS.find((metodo) => metodo.valor === metodoPago) ?? METODOS[0];
  const sociedadesConPagos = useMemo(
    () =>
      pagos.reduce<{ id: string; nombre: string; moneda?: string }[]>((acumulado, pago) => {
        if (!acumulado.some((sociedad) => sociedad.id === pago.sociedad.id)) {
          acumulado.push({
            id: pago.sociedad.id,
            nombre: pago.sociedad.nombre,
            moneda: pago.sociedad.moneda,
          });
        }

        return acumulado;
      }, []),
    [pagos],
  );
  const pagosFiltrados = sociedadFiltroId === 'TODAS' ? pagos : pagos.filter((pago) => pago.sociedad.id === sociedadFiltroId);
  const monedaResumen = pagosFiltrados[0]?.sociedad.moneda ?? pagos[0]?.sociedad.moneda;
  const pagosPorHacer = pagosFiltrados.filter((pago) => ['PENDIENTE', 'ATRASADO', 'RECHAZADO'].includes(pago.estado));
  const pagosEnRevision = pagosFiltrados.filter((pago) => pago.estado === 'REPORTADO');
  const pagosHistorial = pagosFiltrados.filter((pago) => ['CONFIRMADO', 'INCUMPLIDO', 'CANCELADO'].includes(pago.estado));
  const totalPagado = pagosFiltrados.filter((pago) => pago.estado === 'CONFIRMADO').reduce((total, pago) => total + pago.monto, 0);
  const totalDebe = pagosPorHacer.reduce((total, pago) => total + pago.monto, 0);

  useEffect(() => {
    if (sociedadFiltroId !== 'TODAS' && !sociedadesConPagos.some((sociedad) => sociedad.id === sociedadFiltroId)) {
      setSociedadFiltroId('TODAS');
    }
  }, [sociedadFiltroId, sociedadesConPagos]);

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
      const pago = pagos.find((item) => item.id === cuotaPagoId);
      if (!pago || (pago.sociedad.tipoPago !== 'MIXTO' && pago.sociedad.tipoPago !== metodoPago)) {
        setArchivo(null);
        throw new Error('Ese metodo de pago no esta permitido en esta sociedad.');
      }

      if (metodoSeleccionado.requiereComprobante && !archivo) {
        throw new Error('Debes adjuntar un comprobante para deposito o transferencia.');
      }

      if (archivo) {
        await subirEvidenciaPago(token ?? '', cuotaPagoId, archivo);
      }

      return reportarPago(token ?? '', cuotaPagoId, metodoPago);
    },
    onSuccess: async (pagoActualizado) => {
      setMensaje(
        pagoActualizado.estado === 'CONFIRMADO'
          ? 'Pago registrado y confirmado automaticamente.'
          : 'Pago enviado al organizador para revision.',
      );
      setPagoActivo(null);
      setMetodoPago('EFECTIVO');
      setArchivo(null);
      await queryClient.invalidateQueries({ queryKey: ['mis-pagos'] });
      await mostrarInterstitialPagoCuota({
        mostrarAds: Boolean(suscripcion?.mostrarAds),
        anunciosActivos: configuracion.featureFlags.anunciosActivos,
      });
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
    const pago = pagos.find((item) => item.id === cuotaPagoId);
    setMetodoPago(pago?.sociedad.tipoPago === 'MIXTO' ? 'EFECTIVO' : (pago?.sociedad.tipoPago as MetodoPago) || 'EFECTIVO');
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
    const etiquetaCiclo = pago.ciclo ? ` ciclo #${pago.ciclo.numeroCiclo}` : '';
    const puedeReportar = ['PENDIENTE', 'ATRASADO', 'RECHAZADO'].includes(pago.estado);
    const estaActivo = pagoActivo === pago.id;
    const adjuntoActivo = comprobanteActivo === pago.id;
    const requiereComprobantePendiente =
      pago.estado === 'REPORTADO' && pago.metodoPagoReportado !== null && pago.metodoPagoReportado !== 'EFECTIVO' && pago.evidencias.length === 0;
    const metodosPermitidos = METODOS.filter((metodo) => pago.sociedad.tipoPago === 'MIXTO' || pago.sociedad.tipoPago === metodo.valor);

    return (
      <View key={pago.id} className="gap-2 rounded-lg bg-white p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-semibold text-marca-texto">
              {pago.sociedad.nombre} - cuota #{pago.numeroCuota}{etiquetaCiclo}
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
              {metodosPermitidos.map((metodo) => {
                const activo = metodo.valor === metodoPago;
                return (
                  <Pressable
                    key={metodo.valor}
                    className={`rounded-lg border px-3 py-3 ${activo ? 'border-marca-verde bg-emerald-50' : 'border-slate-200 bg-white'}`}
                    onPress={() => {
                      setMetodoPago(metodo.valor);
                      setArchivo(null);
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
          <EstadoVacio
            icono={<Wallet color="#168A5B" size={31} />}
            titulo="Sin cuotas"
            detalle="Cuando inicie un ciclo veras tus cuotas aqui."
            ilustracion={<CreditCard color="#168A5B" size={118} strokeWidth={1.4} />}
          />
        ) : (
          <>
            <View className="rounded-2xl bg-white p-5 shadow-sm">
              <Text className="text-lg font-semibold text-marca-texto">Resumen</Text>
              {sociedadesConPagos.length > 1 ? (
                <View className="mt-4 gap-3">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-sm font-bold uppercase text-slate-500">Filtrar por SAN</Text>
                    {sociedadFiltroId !== 'TODAS' ? (
                      <Text className="text-sm font-bold text-marca-verde" onPress={() => setSociedadFiltroId('TODAS')}>
                        Ver todos
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <ChipFiltroPago
                      etiqueta="Todos"
                      activo={sociedadFiltroId === 'TODAS'}
                      onPress={() => setSociedadFiltroId('TODAS')}
                    />
                    {sociedadesConPagos.map((sociedad) => (
                      <ChipFiltroPago
                        key={sociedad.id}
                        etiqueta={sociedad.nombre}
                        activo={sociedadFiltroId === sociedad.id}
                        onPress={() => setSociedadFiltroId(sociedad.id)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              <View className="mt-3 flex-row gap-3">
                <View className="flex-1 rounded-lg bg-emerald-50 p-3">
                  <Text className="text-xs font-bold uppercase text-marca-verde">Pagado</Text>
                  <Text className="mt-1 font-semibold text-marca-texto">{formatearMonto(totalPagado, monedaResumen)}</Text>
                </View>
                <View className="flex-1 rounded-lg bg-amber-50 p-3">
                  <Text className="text-xs font-bold uppercase text-amber-700">Por pagar</Text>
                  <Text className="mt-1 font-semibold text-marca-texto">{formatearMonto(totalDebe, monedaResumen)}</Text>
                </View>
              </View>
              <Text className="mt-3 text-sm text-slate-600">
                Mostrando {pagosFiltrados.length} de {pagos.length} pago(s).
              </Text>
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

function ChipFiltroPago({ etiqueta, activo, onPress }: { etiqueta: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      className={`rounded-full border px-4 py-2.5 ${activo ? 'border-marca-verde bg-marca-verde' : 'border-slate-200 bg-white'}`}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text className={`text-sm font-bold ${activo ? 'text-white' : 'text-slate-600'}`}>{etiqueta}</Text>
    </Pressable>
  );
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
      {pagos.length === 0 ? <Text className="rounded-2xl bg-white p-4 text-slate-600 shadow-sm">{vacio}</Text> : pagos.map(renderPago)}
    </View>
  );
}

function EstadoVacio({ icono, titulo, detalle, ilustracion }: { icono: ReactNode; titulo: string; detalle: string; ilustracion: ReactNode }) {
  return (
    <View className="gap-8">
      <View className="flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-100">{icono}</View>
          <View className="max-w-[190px]">
            <Text className="text-lg font-bold text-marca-texto">{titulo}</Text>
            <Text className="mt-1 text-base leading-6 text-slate-600">{detalle}</Text>
          </View>
        </View>
        <Text className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-marca-verde">AL DIA</Text>
      </View>
      <View className="items-center justify-center pt-10 opacity-70">
        <View className="h-44 w-44 items-center justify-center rounded-full bg-emerald-50">{ilustracion}</View>
      </View>
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
