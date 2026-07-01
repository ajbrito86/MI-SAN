import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { formatearMonto } from '@/lib/moneda';
import { obtenerResumenDashboard } from '@/services/dashboard-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Home() {
  const token = useAuthStore((state) => state.accessToken);
  const usuario = useAuthStore((state) => state.usuario);
  const { data: resumen } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: () => obtenerResumenDashboard(token ?? ''),
    enabled: Boolean(token),
    refetchInterval: 30000,
  });

  return (
    <ScreenScrollView>
      <AppHeader titulo="Inicio" subtitulo={usuario ? `Hola, ${usuario.nombres}` : 'Resumen de tus sociedades'} />
      <View className="mt-5 gap-4 pb-8">
        <View className="rounded-lg bg-white p-4">
          <Text className="text-lg font-semibold text-marca-texto">Resumen</Text>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1 rounded-lg bg-slate-50 p-3">
              <Text className="text-xs font-bold uppercase text-slate-500">SAN activos</Text>
              <Text className="mt-1 text-xl font-bold text-marca-texto">{resumen?.sociedadesActivas ?? 0}</Text>
            </View>
            <View className="flex-1 rounded-lg bg-amber-50 p-3">
              <Text className="text-xs font-bold uppercase text-amber-700">Cuotas pendientes</Text>
              <Text className="mt-1 text-xl font-bold text-marca-texto">{resumen?.pagosPendientes ?? 0}</Text>
            </View>
          </View>
          <View className="mt-3 rounded-lg bg-emerald-50 p-3">
            <Text className="text-xs font-bold uppercase text-marca-verde">Pendiente total</Text>
            <Text className="mt-1 text-base font-semibold text-marca-texto">
              {formatearMonto(resumen?.totalPendiente ?? 0, resumen?.proximoPago?.moneda ?? 'DOP')}
            </Text>
          </View>
          {resumen?.pagosReportadosPendientes ? (
            <Text className="mt-3 rounded-lg bg-blue-50 p-3 text-sm font-semibold text-marca-azul">
              {resumen.pagosReportadosPendientes} pago(s) reportado(s) pendiente(s) de revision.
            </Text>
          ) : null}
        </View>

        <AppCard
          titulo="Proximo pago"
          detalle={
            resumen?.proximoPago
              ? `Cuota #${resumen.proximoPago.numeroCuota} - ${formatearMonto(resumen.proximoPago.monto, resumen.proximoPago.moneda)} - vence ${new Date(resumen.proximoPago.fechaVencimiento).toLocaleDateString()}`
              : 'No tienes pagos pendientes ahora mismo.'
          }
          estado={resumen?.proximoPago?.estado ?? 'AL DIA'}
          onPress={() => router.push('/payments' as never)}
        />

        <AppCard
          titulo="Proximo cobro"
          detalle={
            resumen?.proximoCobro
              ? `Turno #${resumen.proximoCobro.numeroTurno} - ${formatearMonto(resumen.proximoCobro.montoPlanificado, resumen.proximoCobro.moneda)} - ${new Date(resumen.proximoCobro.fechaProgramada).toLocaleDateString()}`
              : 'No tienes cobros programados ahora mismo.'
          }
          estado={resumen?.proximoCobro ? 'PROGRAMADO' : 'SIN COBRO'}
          onPress={() =>
            resumen?.proximoCobro
              ? router.push({ pathname: '/societies/[id]', params: { id: resumen.proximoCobro.sociedadId } })
              : undefined
          }
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <AppButton titulo="Ver pagos" variante="secundario" onPress={() => router.push('/payments' as never)} />
          </View>
          <View className="flex-1">
            <AppButton titulo="Mis SAN" variante="secundario" onPress={() => router.push('/societies' as never)} />
          </View>
        </View>

        <View className="rounded-lg bg-white p-4">
          <Text className="text-lg font-semibold text-marca-texto">Alertas</Text>
          {resumen?.alertas.length ? (
            <View className="mt-3 gap-3">
              {resumen.alertas.map((alerta) => (
                <View key={alerta.id} className="border-b border-slate-100 pb-3">
                  <Text className="font-semibold text-marca-texto">{alerta.titulo}</Text>
                  <Text className="mt-1 text-sm text-slate-600">{alerta.mensaje}</Text>
                </View>
              ))}
              <AppButton titulo="Ver avisos" variante="secundario" onPress={() => router.push('/notifications' as never)} />
            </View>
          ) : (
            <Text className="mt-2 text-slate-600">No tienes alertas importantes ahora mismo.</Text>
          )}
        </View>
      </View>
    </ScreenScrollView>
  );
}
