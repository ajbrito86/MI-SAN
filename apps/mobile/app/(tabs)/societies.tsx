import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Filter, Users, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { CalendarDatePicker } from '@/components/calendar-date-picker';
import { ScreenScrollView } from '@/components/screen';
import { useSuscripcion } from '@/hooks/use-suscripcion';
import { etiquetaEstadoSociedad } from '@/lib/estados';
import { formatearMonto } from '@/lib/moneda';
import { listarSociedades, type Sociedad } from '@/services/sociedades-service';
import { useAuthStore } from '@/stores/auth-store';

type FiltroRol = 'TODOS' | Sociedad['rol'];
type CampoFecha = 'DESDE' | 'HASTA' | null;

export default function Sociedades() {
  const token = useAuthStore((state) => state.accessToken);
  const usuario = useAuthStore((state) => state.usuario);
  const [filtroRol, setFiltroRol] = useState<FiltroRol>('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [campoFechaAbierto, setCampoFechaAbierto] = useState<CampoFecha>(null);
  const { data: suscripcion } = useSuscripcion();
  const { data: sociedades = [], refetch } = useQuery({
    queryKey: ['sociedades'],
    queryFn: () => listarSociedades(token ?? ''),
    enabled: Boolean(token),
  });
  useFocusEffect(useCallback(() => { if (token) void refetch(); }, [refetch, token]));
  const rangoInvalido = Boolean(fechaDesde && fechaHasta && fechaDesde > fechaHasta);
  const sociedadesFiltradas = useMemo(
    () =>
      sociedades.filter((sociedad) => {
        const fechaInicio = sociedad.fechaInicio.slice(0, 10);
        const coincideRol = filtroRol === 'TODOS' || sociedad.rol === filtroRol;
        const coincideDesde = !fechaDesde || fechaInicio >= fechaDesde;
        const coincideHasta = !fechaHasta || fechaInicio <= fechaHasta;

        return coincideRol && coincideDesde && coincideHasta && !rangoInvalido;
      }),
    [fechaDesde, fechaHasta, filtroRol, rangoInvalido, sociedades],
  );
  const sociedadesOrganizadas = sociedadesFiltradas.filter((sociedad) => sociedad.rol === 'ORGANIZADOR');
  const sociedadesParticipante = sociedadesFiltradas.filter((sociedad) => sociedad.rol === 'PARTICIPANTE');

  function limpiarFiltros() {
    setFiltroRol('TODOS');
    setFechaDesde('');
    setFechaHasta('');
    setCampoFechaAbierto(null);
  }

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

        <FiltrosSociedades
          filtroRol={filtroRol}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          campoFechaAbierto={campoFechaAbierto}
          cantidadResultados={sociedadesFiltradas.length}
          rangoInvalido={rangoInvalido}
          onCambiarRol={setFiltroRol}
          onCambiarFechaDesde={(fecha) => {
            setFechaDesde(fecha);
            setCampoFechaAbierto(null);
          }}
          onCambiarFechaHasta={(fecha) => {
            setFechaHasta(fecha);
            setCampoFechaAbierto(null);
          }}
          onAbrirFecha={(campo) => setCampoFechaAbierto((actual) => (actual === campo ? null : campo))}
          onLimpiar={limpiarFiltros}
        />

        {filtroRol !== 'PARTICIPANTE' ? <SeccionSociedades titulo="Organizo" sociedades={sociedadesOrganizadas} /> : null}
        {filtroRol !== 'ORGANIZADOR' ? <SeccionSociedades titulo="Participo" sociedades={sociedadesParticipante} /> : null}
      </View>
    </ScreenScrollView>
  );
}

function FiltrosSociedades({
  filtroRol,
  fechaDesde,
  fechaHasta,
  campoFechaAbierto,
  cantidadResultados,
  rangoInvalido,
  onCambiarRol,
  onCambiarFechaDesde,
  onCambiarFechaHasta,
  onAbrirFecha,
  onLimpiar,
}: {
  filtroRol: FiltroRol;
  fechaDesde: string;
  fechaHasta: string;
  campoFechaAbierto: CampoFecha;
  cantidadResultados: number;
  rangoInvalido: boolean;
  onCambiarRol: (rol: FiltroRol) => void;
  onCambiarFechaDesde: (fecha: string) => void;
  onCambiarFechaHasta: (fecha: string) => void;
  onAbrirFecha: (campo: Exclude<CampoFecha, null>) => void;
  onLimpiar: () => void;
}) {
  const hayFiltros = filtroRol !== 'TODOS' || Boolean(fechaDesde) || Boolean(fechaHasta);
  const opcionesRol: Array<{ valor: FiltroRol; etiqueta: string }> = [
    { valor: 'TODOS', etiqueta: 'Todas' },
    { valor: 'ORGANIZADOR', etiqueta: 'Organizo' },
    { valor: 'PARTICIPANTE', etiqueta: 'Participo' },
  ];

  return (
    <View className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
            <Filter color="#07985E" size={18} />
          </View>
          <View>
            <Text className="font-bold text-marca-texto">Filtrar sociedades</Text>
            <Text className="text-xs text-slate-500">
              {rangoInvalido ? 'Revisa el rango de fechas' : `${cantidadResultados} ${cantidadResultados === 1 ? 'resultado' : 'resultados'}`}
            </Text>
          </View>
        </View>
        {hayFiltros ? (
          <Pressable className="flex-row items-center gap-1 rounded-full bg-slate-100 px-3 py-2" onPress={onLimpiar}>
            <X color="#475569" size={14} />
            <Text className="text-xs font-bold text-slate-600">Limpiar</Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">Mi rol</Text>
      <View className="mt-2 flex-row gap-2">
        {opcionesRol.map((opcion) => {
          const activa = filtroRol === opcion.valor;
          return (
            <Pressable
              key={opcion.valor}
              className={`flex-1 rounded-xl border px-2 py-3 ${activa ? 'border-marca-verde bg-emerald-50' : 'border-slate-200 bg-white'}`}
              onPress={() => onCambiarRol(opcion.valor)}
            >
              <Text className={`text-center text-sm font-bold ${activa ? 'text-marca-verde' : 'text-slate-600'}`}>{opcion.etiqueta}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">Fecha de inicio</Text>
      <View className="mt-2 flex-row gap-2">
        <BotonFecha etiqueta="Desde" fecha={fechaDesde} activo={campoFechaAbierto === 'DESDE'} onPress={() => onAbrirFecha('DESDE')} />
        <BotonFecha etiqueta="Hasta" fecha={fechaHasta} activo={campoFechaAbierto === 'HASTA'} onPress={() => onAbrirFecha('HASTA')} />
      </View>

      {rangoInvalido ? <Text className="mt-2 text-sm font-semibold text-red-600">La fecha desde no puede ser posterior a la fecha hasta.</Text> : null}

      {campoFechaAbierto === 'DESDE' ? (
        <View className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
          <CalendarDatePicker label="Selecciona la fecha desde" value={fechaDesde} onChange={onCambiarFechaDesde} />
        </View>
      ) : null}
      {campoFechaAbierto === 'HASTA' ? (
        <View className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
          <CalendarDatePicker label="Selecciona la fecha hasta" value={fechaHasta} onChange={onCambiarFechaHasta} />
        </View>
      ) : null}
    </View>
  );
}

function BotonFecha({ etiqueta, fecha, activo, onPress }: { etiqueta: string; fecha: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      className={`flex-1 flex-row items-center gap-2 rounded-xl border px-3 py-3 ${activo ? 'border-marca-verde bg-emerald-50' : 'border-slate-200 bg-white'}`}
      onPress={onPress}
    >
      <CalendarDays color={activo ? '#07985E' : '#64748B'} size={18} />
      <View className="flex-1">
        <Text className="text-xs font-semibold text-slate-500">{etiqueta}</Text>
        <Text className={`text-sm font-bold ${activo ? 'text-marca-verde' : 'text-marca-texto'}`}>{fecha ? formatearFechaFiltro(fecha) : 'Cualquier fecha'}</Text>
      </View>
    </Pressable>
  );
}

function formatearFechaFiltro(fecha: string) {
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
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
