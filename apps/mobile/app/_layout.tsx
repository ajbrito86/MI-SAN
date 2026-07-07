import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppButton } from '@/components/app-button';
import { useConfiguracionMobile } from '@/hooks/use-configuracion-mobile';
import { inicializarAds } from '@/services/ads-service';
import { configurarReporteErroresGlobales } from '@/services/analytics-service';
import { configurarNavegacionPush, registrarDispositivoPush } from '@/services/push-notifications-service';
import { useAuthStore } from '@/stores/auth-store';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    configurarReporteErroresGlobales();
    inicializarAds().catch(() => null);
  }, []);

  useEffect(() => {
    const limpiarNavegacionPush = configurarNavegacionPush();
    return limpiarNavegacionPush;
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    registrarDispositivoPush().catch(() => null);
  }, [accessToken]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AppGate />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function AppGate() {
  const { data: configuracion, refetch, isFetching } = useConfiguracionMobile();

  if (configuracion.mantenimiento.activo) {
    return (
      <View className="flex-1 items-center justify-center bg-marca-fondo px-6">
        <Text className="text-center text-2xl font-bold text-marca-texto">Mantenimiento</Text>
        <Text className="mt-3 text-center text-base leading-6 text-slate-600">{configuracion.mantenimiento.mensaje}</Text>
        <View className="mt-6 w-full">
          <AppButton titulo={isFetching ? 'Verificando...' : 'Reintentar'} disabled={isFetching} onPress={() => refetch()} />
        </View>
      </View>
    );
  }

  if (configuracion.version.forzarActualizacion) {
    return (
      <View className="flex-1 items-center justify-center bg-marca-fondo px-6">
        <Text className="text-center text-2xl font-bold text-marca-texto">Actualizacion requerida</Text>
        <Text className="mt-3 text-center text-base leading-6 text-slate-600">{configuracion.version.mensajeActualizacion}</Text>
        <Text className="mt-2 text-center text-sm font-semibold text-marca-verde">Version minima: {configuracion.version.versionMinima}</Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
