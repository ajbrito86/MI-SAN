import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    },
    onError: (err) => setMensaje(err instanceof Error ? err.message : 'No pudimos aceptar la invitacion.'),
  });
  const rechazarMutation = useMutation({
    mutationFn: (invitacionId: string) => rechazarInvitacion(token ?? '', invitacionId),
    onSuccess: async () => {
      setMensaje('Invitacion rechazada.');
      await queryClient.invalidateQueries({ queryKey: ['mis-invitaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
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
          <View className="gap-3 rounded-lg bg-white p-4">
            <Text className="font-semibold text-red-600">No pudimos cargar tus invitaciones.</Text>
            <AppButton titulo="Reintentar" variante="secundario" onPress={() => refetch()} />
          </View>
        ) : invitaciones.length === 0 ? (
          <AppCard titulo="Sin invitaciones" detalle="No tienes invitaciones pendientes." estado="AL DIA" />
        ) : (
          invitaciones.map((invitacion) => (
            <View key={invitacion.id} className="gap-3 rounded-lg bg-white p-4">
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
