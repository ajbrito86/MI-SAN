import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { Bell, ChevronRight } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  type Notificacion,
} from '@/services/notificaciones-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Notificaciones() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const { data: notificaciones = [] } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => listarNotificaciones(token ?? ''),
    enabled: Boolean(token),
    refetchOnMount: 'always',
  });

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
        void queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
      }
    }, [queryClient, token]),
  );

  const marcarLeidaMutation = useMutation({
    mutationFn: (notificacionId: string) => marcarNotificacionLeida(token ?? '', notificacionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
    },
  });
  const marcarTodasMutation = useMutation({
    mutationFn: () => marcarTodasNotificacionesLeidas(token ?? ''),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
    },
  });
  const noLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;

  const abrirNotificacion = async (notificacion: Notificacion) => {
    if (!notificacion.leida) {
      marcarLeidaMutation.mutate(notificacion.id);
    }

    const metadata = notificacion.metadataJson;

    if (metadata?.destino === 'PAGOS') {
      router.push('/payments' as never);
      return;
    }

    if (metadata?.destino === 'INVITACIONES') {
      router.push('/invitations' as never);
      return;
    }

    if (metadata?.destino === 'CHAT_SAN' && metadata.sociedadId && metadata.participanteId) {
      router.push({
        pathname: '/societies/[id]/chat/[participanteId]',
        params: { id: metadata.sociedadId, participanteId: metadata.participanteId },
      });
      return;
    }

    if (metadata?.sociedadId) {
      router.push({ pathname: '/societies/[id]', params: { id: metadata.sociedadId } });
    }
  };

  return (
    <ScreenScrollView>
      <AppHeader titulo="Avisos" subtitulo={noLeidas > 0 ? `${noLeidas} aviso(s) nuevo(s)` : 'Recordatorios y actividad reciente'} />
      <View className="mt-5 gap-4 pb-8">
        <View className="gap-3">
          <Pressable
            className="min-h-16 flex-row items-center gap-4 rounded-xl border border-marca-verde bg-white px-5 shadow-sm"
            onPress={() => router.push('/invitations' as never)}
          >
            <Bell color="#168A5B" size={24} />
            <Text className="flex-1 text-base font-bold text-marca-verde">Ver invitaciones</Text>
            <ChevronRight color="#168A5B" size={20} />
          </Pressable>
          {noLeidas > 0 ? (
            <AppButton
              titulo={marcarTodasMutation.isPending ? 'Marcando...' : 'Marcar todas como leidas'}
              variante="secundario"
              onPress={() => marcarTodasMutation.mutate()}
              disabled={marcarTodasMutation.isPending}
            />
          ) : null}
        </View>
        {notificaciones.length === 0 ? (
          <View className="gap-8">
            <View className="flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <View className="flex-row items-center gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <Bell color="#168A5B" size={29} />
                </View>
                <View className="max-w-[190px]">
                  <Text className="text-lg font-bold text-marca-texto">Sin avisos</Text>
                  <Text className="mt-1 text-base leading-6 text-slate-600">No tienes notificaciones por ahora.</Text>
                </View>
              </View>
              <Text className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-marca-verde">AL DIA</Text>
            </View>
            <View className="items-center justify-center pt-10 opacity-60">
              <View className="h-44 w-44 items-center justify-center rounded-full bg-emerald-50">
                <Bell color="#168A5B" size={128} strokeWidth={1.2} />
              </View>
            </View>
          </View>
        ) : (
          notificaciones.map((notificacion) => (
            <Pressable
              key={notificacion.id}
              className={`rounded-2xl p-4 shadow-sm ${notificacion.leida ? 'bg-white' : 'bg-emerald-50'}`}
              onPress={() => abrirNotificacion(notificacion)}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-marca-texto">{notificacion.titulo}</Text>
                  <Text className="mt-1 text-sm text-slate-700">{notificacion.mensaje}</Text>
                  <Text className="mt-2 text-xs text-slate-500">{new Date(notificacion.createdAt).toLocaleString()}</Text>
                </View>
                <Text
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    notificacion.leida ? 'bg-slate-100 text-slate-600' : 'bg-marca-verde text-white'
                  }`}
                >
                  {notificacion.leida ? 'LEIDA' : 'NUEVA'}
                </Text>
              </View>
              <Text className="mt-3 text-xs font-semibold uppercase text-slate-500">{etiquetaTipo(notificacion.tipo)}</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScreenScrollView>
  );
}

function etiquetaTipo(tipo: string) {
  const etiquetas: Record<string, string> = {
    RECORDATORIO_PAGO: 'Pago / mensaje',
    PAGO_CONFIRMADO: 'Pago confirmado',
    PAGO_RECHAZADO: 'Pago rechazado',
    INVITACION_RECIBIDA: 'Invitacion',
    INVITACION_ACEPTADA: 'Invitacion aceptada',
    NUEVO_CICLO: 'Nuevo ciclo',
    PROXIMO_COBRO: 'Entrega',
    PROXIMO_VENCIMIENTO: 'Vencimiento',
    PARTICIPANTE_EXPULSADO: 'Participante',
  };

  return etiquetas[tipo] ?? tipo;
}
