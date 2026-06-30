import { Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { formatearMonto } from '@/lib/moneda';
import { listarSociedades } from '@/services/sociedades-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Sociedades() {
  const token = useAuthStore((state) => state.accessToken);
  const usuario = useAuthStore((state) => state.usuario);
  const { data: sociedades = [] } = useQuery({
    queryKey: ['sociedades'],
    queryFn: () => listarSociedades(token ?? ''),
    enabled: Boolean(token),
  });
  const sociedadesOrganizadas = sociedades.filter((sociedad) => sociedad.rol === 'ORGANIZADOR');
  const sociedadesParticipante = sociedades.filter((sociedad) => sociedad.rol === 'PARTICIPANTE');

  return (
    <ScrollView className="flex-1 bg-marca-fondo px-5 pt-12">
      <AppHeader titulo="Mis sociedades" subtitulo="Organiza y consulta tus turnos" />
      <View className="mt-5 gap-4 pb-8">
        {usuario?.rolGlobal === 'ORGANIZADOR' ? (
          <Link href="/societies/create" asChild>
            <AppButton titulo="Crear sociedad como organizador" />
          </Link>
        ) : (
          <Text className="rounded-lg bg-white p-4 text-slate-600">Tu usuario es participante. Veras aqui los san donde participas.</Text>
        )}

        <SeccionSociedades titulo="Organizo" sociedades={sociedadesOrganizadas} />
        <SeccionSociedades titulo="Participo" sociedades={sociedadesParticipante} />
      </View>
    </ScrollView>
  );
}

function SeccionSociedades({ titulo, sociedades }: { titulo: string; sociedades: Awaited<ReturnType<typeof listarSociedades>> }) {
  return (
    <View className="gap-3">
      <Text className="text-base font-bold text-marca-texto">{titulo}</Text>
      {sociedades.length === 0 ? (
        <Text className="rounded-lg bg-white p-4 text-slate-600">No hay sociedades en esta seccion.</Text>
      ) : (
        sociedades.map((sociedad) => (
          <AppCard
            key={sociedad.id}
            titulo={sociedad.nombre}
            detalle={`${formatearMonto(sociedad.montoCuota, sociedad.moneda)} ${sociedad.frecuencia.toLowerCase()}`}
            estado={sociedad.estado}
            onPress={() => router.push({ pathname: '/societies/[id]', params: { id: sociedad.id } })}
          />
        ))
      )}
    </View>
  );
}
