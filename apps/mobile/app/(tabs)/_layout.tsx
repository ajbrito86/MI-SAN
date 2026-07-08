import { useQuery } from '@tanstack/react-query';
import { Redirect, Tabs } from 'expo-router';
import { Bell, CreditCard, Home, User, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contarNotificacionesNoLeidas } from '@/services/notificaciones-service';
import { useAuthStore } from '@/stores/auth-store';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
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
        tabBarStyle: {
          height: 68 + Math.max(insets.bottom, 16),
          paddingBottom: Math.max(insets.bottom, 16),
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
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
