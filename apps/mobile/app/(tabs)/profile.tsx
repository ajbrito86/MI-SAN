import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { AppHeader } from '@/components/app-header';
import { AppButton } from '@/components/app-button';
import { ScreenScrollView } from '@/components/screen';
import { useSuscripcion } from '@/hooks/use-suscripcion';
import { mostrarOpcionesPrivacidadAds } from '@/services/ads-service';
import { logout } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Perfil() {
  const usuario = useAuthStore((state) => state.usuario);
  const token = useAuthStore((state) => state.accessToken);
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion);
  const { data: suscripcion } = useSuscripcion();

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
        <View className="mt-4">
          <AppButton titulo="Editar perfil" variante="secundario" onPress={() => router.push('/account/edit' as never)} />
        </View>
      </View>
      <View className="mt-5 rounded-lg bg-white p-4">
        <Text className="text-lg font-semibold text-marca-texto">Plan actual</Text>
        <Text className="mt-1 text-slate-600">{suscripcion?.nombrePlan ?? 'Consultando suscripcion...'}</Text>
        {suscripcion?.diasRestantes ? (
          <Text className="mt-1 text-sm font-semibold text-marca-verde">{suscripcion.diasRestantes} dias restantes de prueba.</Text>
        ) : null}
        <View className="mt-4">
          <AppButton titulo="Administrar Premium" variante="secundario" onPress={() => router.push('/premium' as never)} />
        </View>
      </View>
      <View className="mt-5 rounded-lg bg-white p-4">
        <Text className="text-lg font-semibold text-marca-texto">Cuenta</Text>
        <Text className="mt-1 text-sm text-slate-600">Puedes solicitar la eliminacion desde la aplicacion.</Text>
        <View className="mt-4 gap-3">
          <AppButton titulo="Politica de privacidad" variante="secundario" onPress={() => router.push('/legal/privacy' as never)} />
          <AppButton titulo="Terminos y condiciones" variante="secundario" onPress={() => router.push('/legal/terms' as never)} />
          <AppButton titulo="Soporte" variante="secundario" onPress={() => router.push('/legal/support' as never)} />
          <AppButton titulo="Acerca de" variante="secundario" onPress={() => router.push('/about' as never)} />
          <AppButton titulo="Privacidad de anuncios" variante="secundario" onPress={() => mostrarOpcionesPrivacidadAds().catch(() => null)} />
          <AppButton titulo="Eliminar cuenta" variante="secundario" onPress={() => router.push('/account/delete' as never)} />
        </View>
      </View>
      <View className="mt-5">
        <AppButton titulo="Cerrar sesion" variante="secundario" onPress={salir} />
      </View>
    </ScreenScrollView>
  );
}
