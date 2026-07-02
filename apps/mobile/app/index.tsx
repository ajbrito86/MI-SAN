import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';

export default function InicioPublico() {
  const token = useAuthStore((state) => state.accessToken);

  return <Redirect href={token ? '/(tabs)/home' : '/login'} />;
}
