import { useQuery } from '@tanstack/react-query';
import { obtenerSuscripcionActual } from '@/services/suscripciones-service';
import { useAuthStore } from '@/stores/auth-store';

export function useSuscripcion() {
  const token = useAuthStore((state) => state.accessToken);
  const usuario = useAuthStore((state) => state.usuario);

  return useQuery({
    queryKey: ['suscripcion-actual', usuario?.id],
    queryFn: obtenerSuscripcionActual,
    enabled: Boolean(token),
    initialData: usuario?.suscripcion,
    staleTime: 60000,
  });
}
