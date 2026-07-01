import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { AppHeader } from '@/components/app-header';
import { AppButton } from '@/components/app-button';
import { ScreenScrollView } from '@/components/screen';
import { logout } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Perfil() {
  const usuario = useAuthStore((state) => state.usuario);
  const token = useAuthStore((state) => state.accessToken);
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion);

  async function salir() {
    if (token) {
      await logout(token).catch(() => null);
    }
    cerrarSesion();
    router.replace('/');
  }

  return (
    <ScreenScrollView>
      <AppHeader titulo="Perfil" subtitulo="Tus datos principales" />
      <View className="mt-5 rounded-lg bg-white p-4">
        <Text className="text-lg font-semibold text-marca-texto">
          {usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Sin sesion activa'}
        </Text>
        <Text className="mt-1 text-slate-600">{usuario?.email ?? 'Inicia sesion para ver tu perfil.'}</Text>
        <Text className="mt-1 text-slate-600">{usuario?.telefono ?? ''}</Text>
        <Text className="mt-1 font-semibold text-marca-verde">{usuario?.rolGlobal ?? ''}</Text>
      </View>
      <View className="mt-5">
        <AppButton titulo="Cerrar sesion" variante="secundario" onPress={salir} />
      </View>
    </ScreenScrollView>
  );
}
