import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { formatearMonto } from '@/lib/moneda';
import { aceptarInvitacion, listarMisInvitaciones, rechazarInvitacion } from '@/services/invitaciones-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Invitaciones() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [mensaje, setMensaje] = useState('');
  const { data: invitaciones = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['mis-invitaciones'],
    queryFn: () => listarMisInvitaciones(token ?? ''),
    enabled: Boolean(token),
  });

  const aceptarMutation = useMutation({
    mutationFn: (invitacionId: string) => aceptarInvitacion(token ?? '', invitacionId),
    onSuccess: async () => {
      setMensaje('Invitacion aceptada. Ya puedes ver esta sociedad en tu lista.');
      await queryClient.invalidateQueries({ queryKey: ['mis-invitaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['sociedades'] });
      await queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] });
    },
    onError: (err) => setMensaje(err instanceof Error ? err.message : 'No pudimos aceptar la invitacion.'),
  });
  const rechazarMutation = useMutation({
    mutationFn: (invitacionId: string) => rechazarInvitacion(token ?? '', invitacionId),
    onSuccess: async () => {
      setMensaje('Invitacion rechazada.');
      await queryClient.invalidateQueries({ queryKey: ['mis-invitaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
    },
    onError: (err) => setMensaje(err instanceof Error ? err.message : 'No pudimos rechazar la invitacion.'),
  });

  return (
    <ScreenScrollView>
      <AppHeader titulo="Invitaciones" subtitulo="Sociedades pendientes de respuesta" mostrarAtras />
      <View className="mt-5 gap-4 pb-8">
        {mensaje ? <Text className="rounded-lg bg-white p-3 text-sm font-semibold text-marca-verde">{mensaje}</Text> : null}
        {isLoading ? (
          <AppCard titulo="Cargando" detalle="Buscando tus invitaciones pendientes." estado="PENDIENTE" />
        ) : isError ? (
          <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="font-semibold text-red-600">No pudimos cargar tus invitaciones.</Text>
            <AppButton titulo="Reintentar" variante="secundario" onPress={() => refetch()} />
          </View>
        ) : invitaciones.length === 0 ? (
          <View className="gap-8">
            <View className="flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <View className="flex-row items-center gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <Mail color="#168A5B" size={30} />
                </View>
                <View className="max-w-[190px]">
                  <Text className="text-lg font-bold text-marca-texto">Sin invitaciones</Text>
                  <Text className="mt-1 text-base leading-6 text-slate-600">No tienes invitaciones pendientes.</Text>
                </View>
              </View>
              <Text className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-marca-verde">AL DIA</Text>
            </View>
            <View className="items-center justify-center pt-10 opacity-70">
              <View className="h-48 w-48 items-center justify-center rounded-full bg-emerald-50">
                <Mail color="#168A5B" size={136} strokeWidth={1.2} />
              </View>
            </View>
          </View>
        ) : (
          invitaciones.map((invitacion) => (
            <View key={invitacion.id} className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <View>
                <Text className="text-lg font-semibold text-marca-texto">{invitacion.sociedad.nombre}</Text>
                <Text className="mt-1 text-slate-600">
                  {formatearMonto(invitacion.sociedad.montoCuota, invitacion.sociedad.moneda)} {invitacion.sociedad.frecuencia.toLowerCase()}
                </Text>
              </View>
              <View className="gap-2">
                <AppButton
                  titulo={aceptarMutation.isPending ? 'Aceptando...' : 'Aceptar'}
                  onPress={() => aceptarMutation.mutate(invitacion.id)}
                  disabled={aceptarMutation.isPending || rechazarMutation.isPending}
                />
                <AppButton
                  titulo={rechazarMutation.isPending ? 'Rechazando...' : 'Rechazar'}
                  variante="secundario"
                  onPress={() => rechazarMutation.mutate(invitacion.id)}
                  disabled={aceptarMutation.isPending || rechazarMutation.isPending}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </ScreenScrollView>
  );
}
