import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bell, CreditCard, FileText, ShieldCheck, Wallet } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { BannerPublicidad } from '@/components/banner-publicidad';
import { ScreenScrollView } from '@/components/screen';
import { TarjetaPremium } from '@/components/tarjeta-premium';
import { formatearMonto } from '@/lib/moneda';
import { useSuscripcion } from '@/hooks/use-suscripcion';
import { obtenerResumenDashboard } from '@/services/dashboard-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Home() {
  const token = useAuthStore((state) => state.accessToken);
  const usuario = useAuthStore((state) => state.usuario);
  const { data: suscripcion } = useSuscripcion();
  const { data: resumen } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: () => obtenerResumenDashboard(token ?? ''),
    enabled: Boolean(token),
    refetchInterval: 30000,
  });

  return (
    <ScreenScrollView>
      <View className="flex-row items-center justify-between">
        <Text className="text-3xl font-extrabold text-marca-texto">{usuario ? `Hola, ${usuario.nombres}` : 'Hola'}</Text>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
          <Bell color="#17231F" size={22} />
        </View>
      </View>
      <View className="mt-8 gap-4 pb-8">
        <View className="pt-1">
          <BannerPublicidad ubicacion="dashboard" />
        </View>
        <AvisoTrial suscripcion={suscripcion} />
        {suscripcion?.mostrarAds ? <TarjetaPremium /> : null}

        <View className="rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-xl font-bold text-marca-texto">Resumen</Text>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1 rounded-xl bg-blue-50/70 p-4">
              <ShieldCheck color="#1F7AAD" size={22} />
              <Text className="mt-2 text-xs font-bold uppercase text-[#1F7AAD]">SAN activos</Text>
              <Text className="mt-1 text-xl font-bold text-marca-texto">{resumen?.sociedadesActivas ?? 0}</Text>
            </View>
            <View className="flex-1 rounded-xl bg-amber-50 p-4">
              <FileText color="#C25B00" size={22} />
              <Text className="mt-2 text-xs font-bold uppercase text-[#C25B00]">Cuotas pendientes</Text>
              <Text className="mt-1 text-xl font-bold text-marca-texto">{resumen?.pagosPendientes ?? 0}</Text>
            </View>
          </View>
          <View className="mt-3 rounded-xl bg-emerald-50 p-4">
            <Wallet color="#168A5B" size={23} />
            <Text className="mt-2 text-xs font-bold uppercase text-marca-verde">Pendiente total</Text>
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
          <AccesoRapido icono={<CreditCard color="#168A5B" size={25} />} titulo="Ver pagos" onPress={() => router.push('/payments' as never)} />
          <AccesoRapido icono={<ShieldCheck color="#168A5B" size={25} />} titulo="Mis SAN" onPress={() => router.push('/societies' as never)} />
        </View>

        <View className="rounded-2xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center gap-3">
            <Bell color="#17231F" size={22} />
            <Text className="text-lg font-semibold text-marca-texto">Alertas</Text>
          </View>
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

function AccesoRapido({ icono, titulo, onPress }: { icono: ReactNode; titulo: string; onPress: () => void }) {
  return (
    <Pressable
      className="min-h-20 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 shadow-sm"
      onPress={onPress}
    >
      <View className="shrink-0">
        {icono}
      </View>
      <Text className="shrink text-center text-base font-semibold text-marca-verde" numberOfLines={2}>
        {titulo}
      </Text>
    </Pressable>
  );
}

function AvisoTrial({
  suscripcion,
}: {
  suscripcion:
    | {
        esTrial: boolean;
        diasRestantes: number | null;
      }
    | null
    | undefined;
}) {
  if (!suscripcion?.esTrial || suscripcion.diasRestantes === null || suscripcion.diasRestantes > 7) {
    return null;
  }

  const titulo =
    suscripcion.diasRestantes <= 0
      ? 'Tu prueba Premium termina hoy'
      : suscripcion.diasRestantes === 1
        ? 'Tu prueba Premium termina manana'
        : `Tu prueba Premium termina en ${suscripcion.diasRestantes} dias`;

  return (
    <View className="rounded-lg bg-amber-50 p-4">
      <Text className="text-base font-bold text-amber-800">{titulo}</Text>
      <Text className="mt-1 text-sm leading-5 text-amber-700">
        Activa Premium por US$0.99 para seguir creando SANes como organizador y mantener la app sin anuncios.
      </Text>
      <View className="mt-3">
        <AppButton titulo="Mantener Premium" onPress={() => router.push('/premium' as never)} />
      </View>
    </View>
  );
}
