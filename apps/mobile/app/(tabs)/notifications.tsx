import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { listarNotificaciones, marcarNotificacionLeida } from '@/services/notificaciones-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Notificaciones() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const { data: notificaciones = [] } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => listarNotificaciones(token ?? ''),
    enabled: Boolean(token),
  });
  const marcarLeidaMutation = useMutation({
    mutationFn: (notificacionId: string) => marcarNotificacionLeida(token ?? '', notificacionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  return (
    <ScrollView className="flex-1 bg-marca-fondo px-5 pt-12">
      <AppHeader titulo="Avisos" subtitulo="Recordatorios y actividad reciente" />
      <View className="mt-5 gap-4 pb-8">
        <AppButton titulo="Ver invitaciones" variante="secundario" onPress={() => router.push('/invitations' as never)} />
        {notificaciones.length === 0 ? (
          <AppCard titulo="Sin avisos" detalle="No tienes notificaciones por ahora." estado="AL DIA" />
        ) : (
          notificaciones.map((notificacion) => (
            <AppCard
              key={notificacion.id}
              titulo={notificacion.titulo}
              detalle={notificacion.mensaje}
              estado={notificacion.leida ? 'LEIDA' : 'NUEVA'}
              onPress={() => marcarLeidaMutation.mutate(notificacion.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
