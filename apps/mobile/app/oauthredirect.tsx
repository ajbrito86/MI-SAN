import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirect() {
  const token = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (hydrated && token) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-marca-fondo px-6">
      <ActivityIndicator color="#168A5B" />
      <Text className="mt-3 text-center text-sm font-semibold text-slate-600">Completando inicio de sesion...</Text>
    </View>
  );
}
