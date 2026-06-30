import { useQuery } from '@tanstack/react-query';
import { Redirect, Tabs } from 'expo-router';
import { Bell, CreditCard, Home, User, Users } from 'lucide-react-native';
import { contarNotificacionesNoLeidas } from '@/services/notificaciones-service';
import { useAuthStore } from '@/stores/auth-store';

export default function TabsLayout() {
  const token = useAuthStore((state) => state.accessToken);
  const { data: noLeidas } = useQuery({
    queryKey: ['notificaciones-no-leidas'],
    queryFn: () => contarNotificacionesNoLeidas(token ?? ''),
    enabled: Boolean(token),
    refetchInterval: 30000,
  });

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#168A5B',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="societies" options={{ title: 'Sociedades', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
      <Tabs.Screen name="payments" options={{ title: 'Pagos', tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} /> }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Avisos',
          tabBarBadge: noLeidas?.cantidad ? noLeidas.cantidad : undefined,
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
