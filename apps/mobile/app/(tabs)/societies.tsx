import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { ScreenScrollView } from '@/components/screen';
import { useSuscripcion } from '@/hooks/use-suscripcion';
import { etiquetaEstadoSociedad } from '@/lib/estados';
import { formatearMonto } from '@/lib/moneda';
import { listarSociedades, type Sociedad } from '@/services/sociedades-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Sociedades() {
  const token = useAuthStore((state) => state.accessToken);
  const usuario = useAuthStore((state) => state.usuario);
  const { data: suscripcion } = useSuscripcion();
  const { data: sociedades = [] } = useQuery({
    queryKey: ['sociedades'],
    queryFn: () => listarSociedades(token ?? ''),
    enabled: Boolean(token),
  });
  const sociedadesOrganizadas = sociedades.filter((sociedad) => sociedad.rol === 'ORGANIZADOR');
  const sociedadesParticipante = sociedades.filter((sociedad) => sociedad.rol === 'PARTICIPANTE');

  return (
    <ScreenScrollView>
      <View className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#07985E] shadow-sm">
          <Users color="#FFFFFF" size={32} />
        </View>
        <Text className="mt-4 text-center text-3xl font-extrabold text-marca-texto">Mis sociedades</Text>
        <Text className="mt-1 text-center text-base text-slate-600">Organiza y consulta tus turnos</Text>
      </View>
      <View className="mt-6 gap-4 pb-8">
        {usuario?.rolGlobal === 'ORGANIZADOR' || suscripcion?.premium ? (
          <AppButton titulo="Crear sociedad como organizador" onPress={() => router.push('/societies/create' as never)} />
        ) : (
          <Text className="rounded-lg bg-white p-4 text-slate-600">
            Tu prueba Premium termino. Puedes participar en SANes; activa Premium para crear nuevos SANes como organizador.
          </Text>
        )}

        <SeccionSociedades titulo="Organizo" sociedades={sociedadesOrganizadas} />
        <SeccionSociedades titulo="Participo" sociedades={sociedadesParticipante} />
      </View>
    </ScreenScrollView>
  );
}

function SeccionSociedades({ titulo, sociedades }: { titulo: string; sociedades: Awaited<ReturnType<typeof listarSociedades>> }) {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <Text className="text-base font-bold text-marca-texto">{titulo}</Text>
      {sociedades.length === 0 ? (
        <View className="mt-4 flex-row items-center gap-4 rounded-xl bg-emerald-50/60 p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <Users color="#168A5B" size={24} />
          </View>
          <Text className="flex-1 text-slate-600">No hay sociedades en esta seccion.</Text>
        </View>
      ) : (
        <View className="mt-3 gap-3">{sociedades.map((sociedad) => <SociedadCard key={sociedad.id} sociedad={sociedad} />)}</View>
      )}
    </View>
  );
}

function SociedadCard({ sociedad }: { sociedad: Sociedad }) {
  const participantes = sociedad.participantesRegistrados ?? 0;
  const textoParticipantes =
    participantes > 0 ? `${participantes}/${sociedad.cantidadParticipantes} participantes` : `${sociedad.cantidadParticipantes} planificados`;
  const etiquetaRol = sociedad.rol === 'ORGANIZADOR' ? 'Organizador' : 'Participante';

  return (
    <View className="rounded-2xl border border-slate-100 bg-white p-4">
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
          {etiquetaEstadoSociedad(sociedad.estado)}
        </Text>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <View className="rounded-lg bg-slate-50 px-3 py-2">
          <Text className="text-xs font-bold uppercase text-slate-500">Rol</Text>
          <Text className="mt-1 text-sm font-semibold text-marca-texto">{etiquetaRol}</Text>
        </View>
        <View className="rounded-lg bg-slate-50 px-3 py-2">
          <Text className="text-xs font-bold uppercase text-slate-500">Inicio</Text>
          <Text className="mt-1 text-sm font-semibold text-marca-texto">{new Date(sociedad.fechaInicio).toLocaleDateString()}</Text>
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
