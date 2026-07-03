import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useConfiguracionMobile } from '@/hooks/use-configuracion-mobile';
import { AppButton } from './app-button';

export function TarjetaPremium() {
  const { data: configuracion } = useConfiguracionMobile();

  if (!configuracion.featureFlags.premiumActivo) {
    return null;
  }

  return (
    <View className="rounded-lg bg-emerald-50 p-4">
      <View className="flex-row items-start gap-3">
        <View className="rounded-lg bg-white p-2">
          <ShieldCheck color="#168A5B" size={22} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-marca-texto">MI-SAN Premium</Text>
          <Text className="mt-1 text-sm text-slate-600">Disfruta una experiencia sin anuncios por US$0.99.</Text>
        </View>
      </View>
      <View className="mt-4">
        <AppButton titulo="Eliminar anuncios" onPress={() => router.push('/premium' as never)} />
      </View>
    </View>
  );
}
