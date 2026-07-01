import { Link, Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { ScreenTopView } from '@/components/screen';
import { useAuthStore } from '@/stores/auth-store';

export default function InicioPublico() {
  const token = useAuthStore((state) => state.accessToken);

  if (token) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <ScreenTopView className="flex-1 bg-marca-fondo">
      <View className="flex-1 justify-center gap-8">
        <View className="gap-3">
          <Text className="text-4xl font-bold text-marca-texto">Mi-San</Text>
          <Text className="text-lg leading-7 text-slate-700">
            Administra tu sociedad con claridad: turnos, cuotas, comprobantes y recordatorios en un solo lugar.
          </Text>
        </View>

        <View className="gap-3">
          <Link href="/login" asChild>
            <AppButton titulo="Iniciar sesion" />
          </Link>
          <Link href="/register" asChild>
            <AppButton titulo="Crear cuenta" variante="secundario" />
          </Link>
        </View>
      </View>
    </ScreenTopView>
  );
}
