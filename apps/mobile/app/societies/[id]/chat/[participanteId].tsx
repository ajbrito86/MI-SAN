import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { enviarMensajeSan, listarMensajesSan } from '@/services/chats-service';
import { useAuthStore } from '@/stores/auth-store';

export default function ChatSan() {
  const { id, participanteId, nombre } = useLocalSearchParams<{ id: string; participanteId: string; nombre?: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const usuarioActual = useAuthStore((state) => state.usuario);
  const queryClient = useQueryClient();
  const [mensaje, setMensaje] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');

  const { data: mensajes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['chat-san', id, participanteId],
    queryFn: () => listarMensajesSan(token ?? '', id, participanteId),
    enabled: Boolean(token && id && participanteId),
    refetchInterval: 10000,
  });

  const enviarMutation = useMutation({
    mutationFn: () => enviarMensajeSan(token ?? '', id, participanteId, mensaje.trim()),
    onSuccess: async () => {
      setMensaje('');
      setMensajeAccion('');
      await queryClient.invalidateQueries({ queryKey: ['chat-san', id, participanteId] });
      await queryClient.invalidateQueries({ queryKey: ['chats-san', id] });
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos enviar el mensaje.'),
  });

  return (
    <KeyboardAvoidingView className="flex-1 bg-marca-fondo" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-5 pt-12">
        <AppHeader titulo="Chat privado" subtitulo={nombre ? `SAN - ${nombre}` : 'Conversacion del SAN'} mostrarAtras />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-4">
        {isLoading ? (
          <AppCard titulo="Cargando chat" detalle="Buscando los mensajes de esta conversacion." estado="PENDIENTE" />
        ) : isError ? (
          <View className="gap-3 rounded-lg bg-white p-4">
            <Text className="font-semibold text-red-600">No pudimos cargar esta conversacion.</Text>
            <AppButton titulo="Reintentar" variante="secundario" onPress={() => refetch()} />
          </View>
        ) : mensajes.length === 0 ? (
          <View className="rounded-lg bg-white p-4">
            <Text className="text-slate-600">Aun no hay mensajes en esta conversacion.</Text>
          </View>
        ) : (
          mensajes.map((item) => {
            const esMio = item.remitente.id === usuarioActual?.id;

            return (
              <View key={item.id} className={`max-w-[85%] rounded-lg p-3 ${esMio ? 'self-end bg-emerald-50' : 'self-start bg-white'}`}>
                <Text className={`text-xs font-semibold ${esMio ? 'text-marca-verde' : 'text-slate-500'}`}>
                  {esMio ? 'Tu' : `${item.remitente.nombres} ${item.remitente.apellidos}`}
                </Text>
                <Text className="mt-1 text-base text-marca-texto">{item.mensaje}</Text>
                <Text className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
      <View className="gap-3 border-t border-slate-200 bg-white px-5 py-4">
        {mensajeAccion ? <Text className="text-sm font-semibold text-red-600">{mensajeAccion}</Text> : null}
        <TextInput
          className="min-h-20 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base"
          placeholder="Escribe un mensaje privado"
          multiline
          value={mensaje}
          onChangeText={setMensaje}
        />
        <AppButton
          titulo={enviarMutation.isPending ? 'Enviando...' : 'Enviar mensaje'}
          onPress={() => enviarMutation.mutate()}
          disabled={enviarMutation.isPending || !mensaje.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
