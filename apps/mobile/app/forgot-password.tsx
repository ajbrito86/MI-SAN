import { Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { ScreenTopView } from '@/components/screen';

export default function RecuperarContrasena() {
  return (
    <ScreenTopView className="flex-1 bg-marca-fondo">
      <View className="flex-1 justify-center gap-5">
        <Text className="text-3xl font-bold text-marca-texto">Recuperar contrasena</Text>
        <Text className="text-base text-slate-600">Te enviaremos instrucciones para recuperar tu acceso.</Text>
        <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Telefono o correo" />
        <AppButton titulo="Enviar instrucciones" />
      </View>
    </ScreenTopView>
  );
}
