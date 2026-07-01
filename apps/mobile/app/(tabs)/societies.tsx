import { Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { formatearMonto } from '@/lib/moneda';
import { listarSociedades, type Sociedad } from '@/services/sociedades-service';
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
        sociedades.map((sociedad) => <SociedadCard key={sociedad.id} sociedad={sociedad} />)
      )}
    </View>
  );
}

function SociedadCard({ sociedad }: { sociedad: Sociedad }) {
  const participantes = sociedad.participantesRegistrados ?? 0;
  const textoParticipantes =
    participantes > 0 ? `${participantes}/${sociedad.cantidadParticipantes} participantes` : `${sociedad.cantidadParticipantes} planificados`;

  return (
    <View className="rounded-lg bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-marca-texto">{sociedad.nombre}</Text>
          <Text className="mt-1 text-slate-600">
            {formatearMonto(sociedad.montoCuota, sociedad.moneda)} {sociedad.frecuencia.toLowerCase()}
          </Text>
        </View>
        <Text
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            sociedad.estado === 'ACTIVA' ? 'bg-emerald-50 text-marca-verde' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {sociedad.estado}
        </Text>
      </View>
      <View className="mt-3 flex-row gap-2">
        <View className="flex-1 rounded-lg bg-slate-50 p-3">
          <Text className="text-xs font-bold uppercase text-slate-500">Rol</Text>
          <Text className="mt-1 font-semibold text-marca-texto">{sociedad.rol}</Text>
        </View>
        <View className="flex-1 rounded-lg bg-slate-50 p-3">
          <Text className="text-xs font-bold uppercase text-slate-500">Inicio</Text>
          <Text className="mt-1 font-semibold text-marca-texto">{new Date(sociedad.fechaInicio).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text className="mt-3 text-sm font-semibold text-slate-600">{textoParticipantes}</Text>
      <View className="mt-3">
        <AppButton
          titulo="Ver SAN"
          variante="secundario"
          onPress={() => router.push({ pathname: '/societies/[id]', params: { id: sociedad.id } })}
        />
      </View>
    </View>
  );
}
