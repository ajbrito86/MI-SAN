import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/app-button';
import { type MensajeChat, enviarMensajeSan, listarMensajesSan } from '@/services/chats-service';
import { obtenerSociedad } from '@/services/sociedades-service';
import { useAuthStore } from '@/stores/auth-store';

export default function ChatSan() {
  const { id, participanteId, nombre } = useLocalSearchParams<{ id: string; participanteId: string; nombre?: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const usuarioActual = useAuthStore((state) => state.usuario);
  const queryClient = useQueryClient();
  const listaRef = useRef<FlatList<MensajeChat>>(null);
  const inputRef = useRef<TextInput>(null);
  const [mensaje, setMensaje] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');
  const queryKey = ['chat-san', id, participanteId] as const;

  const { data: sociedad } = useQuery({
    queryKey: ['sociedad', id],
    queryFn: () => obtenerSociedad(token ?? '', id),
    enabled: Boolean(token && id),
  });
  const chatSoloLectura = sociedad?.estado === 'CANCELADA' || sociedad?.estado === 'FINALIZADA';

  const { data: mensajes = [], isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => listarMensajesSan(token ?? '', id, participanteId),
    enabled: Boolean(token && id && participanteId),
    refetchInterval: 10000,
  });

  const enviarMutation = useMutation({
    mutationFn: (texto: string) => enviarMensajeSan(token ?? '', id, participanteId, texto),
    onSuccess: async (mensajeEnviado) => {
      setMensaje('');
      setMensajeAccion('');
      queryClient.setQueryData<MensajeChat[]>(queryKey, (actuales = []) =>
        actuales.some((item) => item.id === mensajeEnviado.id) ? actuales : [...actuales, mensajeEnviado],
      );
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ['chats-san', id] });
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos enviar el mensaje.'),
  });

  useEffect(() => {
    if (mensajes.length > 0) {
      listaRef.current?.scrollToEnd({ animated: true });
    }
  }, [mensajes.length]);

  const enviarMensaje = () => {
    const texto = mensaje.trim();

    if (!texto || chatSoloLectura || enviarMutation.isPending) {
      return;
    }

    enviarMutation.mutate(texto);
  };

  const renderMensaje: ListRenderItem<MensajeChat> = ({ item }) => {
    const esMio = item.remitente.id === usuarioActual?.id;

    return (
      <View className={`mb-2 max-w-[84%] rounded-2xl px-3.5 py-2.5 ${esMio ? 'self-end bg-emerald-100' : 'self-start bg-white'}`}>
        <Text className={`text-xs font-semibold ${esMio ? 'text-marca-verde' : 'text-slate-500'}`}>
          {esMio ? 'Tú' : `${item.remitente.nombres} ${item.remitente.apellidos}`}
        </Text>
        <Text className="mt-0.5 text-base leading-5 text-marca-texto">{item.mensaje}</Text>
        <Text className="mt-1 text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-marca-fondo" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View className="flex-row items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <ChevronLeft color="#17231F" size={23} />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-bold text-marca-texto">Chat privado</Text>
            <Text className="text-sm text-slate-600" numberOfLines={1}>
              {nombre ? `SAN · ${nombre}` : 'Conversación del SAN'}
            </Text>
          </View>
        </View>

        <FlatList
          ref={listaRef}
          className="flex-1 px-4"
          data={isLoading || isError ? [] : mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderMensaje}
          contentContainerStyle={{ flexGrow: 1, justifyContent: mensajes.length > 0 ? 'flex-end' : 'center', paddingVertical: 12 }}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={Keyboard.dismiss}
          onTouchEnd={Keyboard.dismiss}
          onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Pressable className="flex-1 items-center justify-center px-6" onPress={Keyboard.dismiss}>
              {isLoading ? (
                <Text className="text-center font-semibold text-slate-500">Cargando conversación...</Text>
              ) : isError ? (
                <View className="w-full gap-3 rounded-2xl bg-white p-4">
                  <Text className="text-center font-semibold text-red-600">No pudimos cargar esta conversación.</Text>
                  <AppButton titulo="Reintentar" variante="secundario" onPress={() => refetch()} />
                </View>
              ) : (
                <View className="items-center">
                  <Text className="text-center text-lg font-bold text-marca-texto">Todavía no hay mensajes</Text>
                  <Text className="mt-2 text-center text-sm leading-5 text-slate-600">
                    Envía el primer mensaje para comenzar la conversación.
                  </Text>
                </View>
              )}
            </Pressable>
          }
        />

        <View className="border-t border-slate-200 bg-white px-3 py-2.5">
          {chatSoloLectura ? (
            <Text className="mb-2 rounded-lg bg-slate-50 p-2 text-sm font-semibold text-slate-600">
              Este SAN está cerrado. El chat está disponible solo para consulta.
            </Text>
          ) : null}
          {mensajeAccion ? <Text className="mb-2 text-sm font-semibold text-red-600">{mensajeAccion}</Text> : null}
          <View className="flex-row items-end gap-2">
            <TextInput
              ref={inputRef}
              className={`max-h-28 min-h-12 flex-1 rounded-2xl border px-4 py-3 text-base ${
                chatSoloLectura ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-slate-50 text-marca-texto'
              }`}
              placeholder={chatSoloLectura ? 'Chat en modo lectura' : 'Escribe un mensaje...'}
              placeholderTextColor="#94A3B8"
              multiline
              blurOnSubmit={false}
              textAlignVertical="top"
              scrollEnabled
              value={mensaje}
              onChangeText={setMensaje}
              editable={!chatSoloLectura}
            />
            <Pressable
              className={`h-12 w-12 items-center justify-center rounded-full ${
                chatSoloLectura || enviarMutation.isPending || !mensaje.trim() ? 'bg-slate-200' : 'bg-marca-verde'
              }`}
              onPress={enviarMensaje}
              disabled={chatSoloLectura || enviarMutation.isPending || !mensaje.trim()}
              accessibilityRole="button"
              accessibilityLabel={enviarMutation.isPending ? 'Enviando mensaje' : 'Enviar mensaje'}
            >
              <Send color="#FFFFFF" size={20} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
