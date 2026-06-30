import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { formatearMonto } from '@/lib/moneda';
import { getPublicFileUrl } from '@/services/api';
import { subirEvidenciaPago, type ArchivoEvidencia } from '@/services/evidencias-service';
import { listarMisPagos, type MetodoPago, reportarPago } from '@/services/pagos-service';
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
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [archivo, setArchivo] = useState<ArchivoEvidencia | null>(null);

  const { data: pagos = [] } = useQuery({
    queryKey: ['mis-pagos'],
    queryFn: () => listarMisPagos(token ?? ''),
    enabled: Boolean(token),
  });

  const metodoSeleccionado = METODOS.find((metodo) => metodo.valor === metodoPago) ?? METODOS[0];

  const seleccionarArchivo = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (resultado.canceled) {
      return;
    }

    const elegido = resultado.assets[0];
    setArchivo({
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

      await reportarPago(token ?? '', cuotaPagoId, metodoPago);

      if (archivo) {
        await subirEvidenciaPago(token ?? '', cuotaPagoId, archivo);
      }
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

  const iniciarReporte = (cuotaPagoId: string) => {
    setMensaje(null);
    setArchivo(null);
    setMetodoPago('EFECTIVO');
    setPagoActivo(cuotaPagoId);
  };

  return (
    <ScrollView className="flex-1 bg-marca-fondo px-5 pt-12">
      <AppHeader titulo="Pagos" subtitulo="Reporta tus cuotas y consulta su estado" />
      <View className="mt-5 gap-4 pb-24">
        {mensaje ? <Text className="rounded-lg bg-white p-3 text-sm font-semibold text-marca-verde">{mensaje}</Text> : null}
        {pagos.length === 0 ? (
          <AppCard titulo="Sin cuotas" detalle="Cuando inicie un ciclo veras tus cuotas aqui." estado="AL DIA" />
        ) : (
          pagos.map((pago) => {
            const puedeReportar = ['PENDIENTE', 'ATRASADO', 'RECHAZADO'].includes(pago.estado);
            const estaActivo = pagoActivo === pago.id;

            return (
              <View key={pago.id} className="gap-2">
                <AppCard
                  titulo={`${pago.sociedad.nombre} - cuota #${pago.numeroCuota}`}
                  detalle={`${formatearMonto(pago.monto, pago.sociedad.moneda)} vence ${new Date(pago.fechaVencimiento).toLocaleDateString()}`}
                  estado={pago.estado}
                />

                {pago.metodoPagoReportado ? (
                  <Text className="text-sm font-semibold text-slate-600">Metodo reportado: {etiquetaMetodo(pago.metodoPagoReportado)}</Text>
                ) : null}

                {puedeReportar && !estaActivo ? (
                  <AppButton titulo="Hacer pago" onPress={() => iniciarReporte(pago.id)} />
                ) : null}

                {puedeReportar && estaActivo ? (
                  <View className="gap-3 rounded-lg bg-white p-4">
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
                        <AppButton titulo={archivo ? 'Cambiar comprobante' : 'Adjuntar comprobante'} variante="secundario" onPress={seleccionarArchivo} />
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

                {pago.evidencias.length > 0 ? (
                  <View className="rounded-lg bg-white p-3">
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
          })
        )}
      </View>
    </ScrollView>
  );
}

function etiquetaMetodo(metodo: string) {
  return METODOS.find((item) => item.valor === metodo)?.etiqueta ?? metodo;
}
