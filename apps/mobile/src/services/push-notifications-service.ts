import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type * as ExpoNotifications from 'expo-notifications';
import { router } from 'expo-router';
import { Linking, Platform } from 'react-native';
import { apiRequestAutenticado } from './api';

type PushMetadata = {
  sociedadId?: string;
  participanteId?: string;
  destino?: 'DETALLE_SAN' | 'PAGOS' | 'INVITACIONES' | 'CHAT_SAN';
};

const registroPushKey = 'mi-san.push-registration';
const isExpoGo = Constants.appOwnership === 'expo';
export const pushNotificationsEnabled = process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true';
let handlerConfigurado = false;

function cargarNotifications(): typeof ExpoNotifications {
  return require('expo-notifications') as typeof ExpoNotifications;
}

export async function registrarDispositivoPush() {
  if (!pushNotificationsEnabled || isExpoGo || Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  const Notifications = cargarNotifications();

  if (!handlerConfigurado) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    handlerConfigurado = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Avisos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#168A5B',
    });
  }

  const permisosActuales = await Notifications.getPermissionsAsync();
  const permisos =
    permisosActuales.status === 'granted' ? permisosActuales : await Notifications.requestPermissionsAsync();

  if (permisos.status !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;

  await apiRequestAutenticado<{ mensaje: string }>('/notifications/push-token', {
    method: 'POST',
    body: JSON.stringify({ pushToken: token, plataforma: Platform.OS }),
  });
  await AsyncStorage.setItem(registroPushKey, JSON.stringify({ pushToken: token, plataforma: Platform.OS }));

  return token;
}

export async function obtenerEstadoPermisosPush() {
  if (!pushNotificationsEnabled || isExpoGo || Platform.OS === 'web' || !Device.isDevice) {
    return 'unavailable' as const;
  }

  const Notifications = cargarNotifications();
  const permisos = await Notifications.getPermissionsAsync();

  return permisos.status;
}

export async function abrirConfiguracionNotificaciones() {
  await Linking.openSettings();
}

export async function eliminarDispositivoPush() {
  const registro = await AsyncStorage.getItem(registroPushKey);
  await AsyncStorage.removeItem(registroPushKey);

  if (!registro) {
    return null;
  }

  return apiRequestAutenticado<{ mensaje: string }>('/notifications/push-token', {
    method: 'DELETE',
    noCerrarSesionEnUnauthorized: true,
  });
}

export function configurarNavegacionPush() {
  if (!pushNotificationsEnabled || isExpoGo) {
    return () => undefined;
  }

  let subscription: { remove(): void } | undefined;
  try {
    const Notifications = cargarNotifications();
    subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        metadata?: PushMetadata;
      };

      abrirDestinoPush(data.metadata);
    });
  } catch {
    return () => undefined;
  }

  return () => subscription?.remove();
}

function abrirDestinoPush(metadata?: PushMetadata) {
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
    return;
  }

  router.push('/notifications' as never);
}
