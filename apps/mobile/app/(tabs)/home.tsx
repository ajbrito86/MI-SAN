import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { formatearMonto } from '@/lib/moneda';
import { listarMisPagos } from '@/services/pagos-service';
import { listarSociedades } from '@/services/sociedades-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Home() {
  const token = useAuthStore((state) => state.accessToken);
  const usuario = useAuthStore((state) => state.usuario);
  const { data: pagos = [] } = useQuery({
    queryKey: ['mis-pagos'],
    queryFn: () => listarMisPagos(token ?? ''),
    enabled: Boolean(token),
  });
  const { data: sociedades = [] } = useQuery({
    queryKey: ['sociedades'],
    queryFn: () => listarSociedades(token ?? ''),
    enabled: Boolean(token),
  });
  const proximoPago = pagos.find((pago) => pago.estado === 'PENDIENTE' || pago.estado === 'ATRASADO');

  return (
    <ScrollView className="flex-1 bg-marca-fondo px-5 pt-12">
      <AppHeader titulo="Inicio" subtitulo={usuario ? `Hola, ${usuario.nombres}` : 'Resumen de tus sociedades'} />
      <View className="mt-5 gap-4 pb-8">
        <AppCard
          titulo="Proximo pago"
          detalle={
            proximoPago
              ? `${formatearMonto(proximoPago.monto, proximoPago.sociedad.moneda)} - ${proximoPago.sociedad.nombre}`
              : 'No tienes pagos pendientes ahora mismo.'
          }
          estado={proximoPago?.estado ?? 'AL DIA'}
        />
        <AppCard
          titulo="Sociedades activas"
          detalle={`${sociedades.length} sociedad${sociedades.length === 1 ? '' : 'es'} registrada${sociedades.length === 1 ? '' : 's'}`}
          estado="RESUMEN"
        />
        <AppButton titulo="Ver pagos" variante="secundario" onPress={() => router.push('/payments' as never)} />
        <View className="rounded-lg bg-white p-4">
          <Text className="text-lg font-semibold text-marca-texto">Alertas</Text>
          <Text className="mt-2 text-slate-600">No tienes alertas importantes ahora mismo.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
