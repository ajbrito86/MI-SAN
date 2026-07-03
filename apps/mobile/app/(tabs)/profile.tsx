import { router } from 'expo-router';
import { Bell, ChevronRight, Crown, FileText, HelpCircle, Info, LogOut, Shield, Trash2 } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
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

  const iniciales = usuario ? `${usuario.nombres[0] ?? ''}${usuario.apellidos[0] ?? ''}`.toUpperCase() : 'MS';

  return (
    <ScreenScrollView contentContainerStyle={{ paddingTop: 0 }}>
      <View className="-mx-5 h-36 bg-[#075A37]" />
      <View className="-mt-14 pb-8">
        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full border-8 border-white bg-[#0B3F2C] shadow-sm">
            <Text className="text-3xl font-extrabold text-white">{iniciales}</Text>
          </View>
          <Text className="mt-3 text-center text-2xl font-extrabold text-marca-texto">
            {usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Sin sesion activa'}
          </Text>
          <Text className="mt-1 text-center text-slate-600">{usuario?.email ?? 'Inicia sesion para ver tu perfil.'}</Text>
          <Text className="mt-1 text-center text-slate-600">{usuario?.telefono ?? ''}</Text>
          <Text className="mt-2 text-center text-sm font-extrabold uppercase text-marca-verde">{usuario?.rolGlobal ?? ''}</Text>
        </View>

        <View className="mt-5">
          <AppButton titulo="Editar perfil" variante="secundario" onPress={() => router.push('/account/edit' as never)} />
        </View>

        <View className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <Crown color="#C69111" size={22} />
            <View className="flex-1">
              <Text className="font-bold text-marca-texto">Plan actual</Text>
              <Text className="mt-1 text-sm text-slate-600">{suscripcion?.nombrePlan ?? 'Consultando suscripcion...'}</Text>
              {suscripcion?.diasRestantes ? (
                <Text className="mt-1 text-xs font-semibold text-marca-verde">{suscripcion.diasRestantes} dias restantes de prueba.</Text>
              ) : null}
            </View>
          </View>
          <View className="mt-4">
            <AppButton titulo="Administrar Premium" variante="secundario" onPress={() => router.push('/premium' as never)} />
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-lg font-bold text-marca-texto">Cuenta</Text>
          <Text className="mt-1 text-sm text-slate-600">Puedes solicitar la eliminacion desde la aplicacion.</Text>
          <View className="mt-4 gap-3">
            <FilaCuenta icono={<Shield color="#64748B" size={19} />} titulo="Politica de privacidad" onPress={() => router.push('/legal/privacy' as never)} />
            <FilaCuenta icono={<FileText color="#64748B" size={19} />} titulo="Terminos y condiciones" onPress={() => router.push('/legal/terms' as never)} />
            <FilaCuenta icono={<HelpCircle color="#64748B" size={19} />} titulo="Soporte" onPress={() => router.push('/legal/support' as never)} />
            <FilaCuenta icono={<Info color="#64748B" size={19} />} titulo="Acerca de" onPress={() => router.push('/about' as never)} />
            <FilaCuenta icono={<Bell color="#64748B" size={19} />} titulo="Privacidad de anuncios" onPress={() => mostrarOpcionesPrivacidadAds().catch(() => null)} />
          </View>
        </View>

        <View className="mt-8 gap-3">
          <Pressable
            className="min-h-14 flex-row items-center justify-center gap-3 rounded-xl border border-red-200 bg-white"
            onPress={() => router.push('/account/delete' as never)}
          >
            <Trash2 color="#B42318" size={18} />
            <Text className="font-semibold text-[#B42318]">Eliminar cuenta</Text>
          </Pressable>
          <Pressable className="min-h-14 flex-row items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-white" onPress={salir}>
            <LogOut color="#0F6B4B" size={18} />
            <Text className="font-semibold text-[#0F6B4B]">Cerrar sesion</Text>
          </Pressable>
        </View>
      </View>
    </ScreenScrollView>
  );
}

function FilaCuenta({ icono, titulo, onPress }: { icono: ReactNode; titulo: string; onPress: () => void }) {
  return (
    <Pressable className="min-h-14 flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm" onPress={onPress}>
      {icono}
      <Text className="flex-1 font-semibold text-slate-700">{titulo}</Text>
      <ChevronRight color="#64748B" size={18} />
    </Pressable>
  );
}
