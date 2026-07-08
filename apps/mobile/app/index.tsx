import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';

export default function InicioPublico() {
  const token = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-marca-fondo">
        <ActivityIndicator color="#168A5B" />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)/home' : '/login'} />;
}
