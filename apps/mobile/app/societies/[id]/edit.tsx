import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { CalendarDatePicker } from '@/components/calendar-date-picker';
import { ScreenScrollView } from '@/components/screen';
import { prepararSociedadPayload } from '@/lib/sociedad-form';
import {
  actualizarSociedad,
  obtenerSociedad,
  type CrearSociedadPayload,
} from '@/services/sociedades-service';
import { useAuthStore } from '@/stores/auth-store';

type Frecuencia = CrearSociedadPayload['frecuencia'];
type Modalidad = CrearSociedadPayload['modalidadTurnos'];
type TipoPago = CrearSociedadPayload['tipoPago'];
type Moneda = CrearSociedadPayload['moneda'];

export default function EditarSociedad() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [formulario, setFormulario] = useState({
    nombre: '',
    montoCuota: '',
    moneda: 'DOP' as Moneda,
    cantidadParticipantes: '',
    fechaInicio: new Date().toISOString().slice(0, 10),
    frecuencia: 'MENSUAL' as Frecuencia,
    modalidadTurnos: 'MANUAL' as Modalidad,
    tipoPago: 'MIXTO' as TipoPago,
  });
  const [error, setError] = useState('');

  const { data: sociedad } = useQuery({
    queryKey: ['sociedad', id],
    queryFn: () => obtenerSociedad(token ?? '', id),
    enabled: Boolean(token && id),
  });

  useEffect(() => {
    if (!sociedad) {
      return;
    }

    setFormulario({
      nombre: sociedad.nombre,
      montoCuota: String(sociedad.montoCuota),
      moneda: sociedad.moneda,
      cantidadParticipantes: String(sociedad.cantidadParticipantes),
      fechaInicio: new Date(sociedad.fechaInicio).toISOString().slice(0, 10),
      frecuencia: sociedad.frecuencia as Frecuencia,
      modalidadTurnos: sociedad.modalidadTurnos,
      tipoPago: sociedad.tipoPago,
    });
  }, [sociedad]);

  const actualizarMutation = useMutation({
    mutationFn: (payload: CrearSociedadPayload) => actualizarSociedad(token ?? '', id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sociedad', id] });
      await queryClient.invalidateQueries({ queryKey: ['sociedades'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] });
      router.replace({ pathname: '/societies/[id]', params: { id } });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'No pudimos actualizar la sociedad.'),
  });

  function actualizar(campo: keyof typeof formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function enviar() {
    setError('');
    const resultado = prepararSociedadPayload(formulario);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    actualizarMutation.mutate(resultado.payload);
  }

  const puedeEditar = sociedad?.rol === 'ORGANIZADOR' && sociedad.estado === 'CONFIGURACION';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenScrollView>
        <View className="gap-4">
          <AppHeader titulo="Editar sociedad" subtitulo="Solo puedes cambiar datos antes de iniciar el SAN." mostrarAtras />
          {!puedeEditar && sociedad ? (
            <Text className="rounded-lg bg-white p-4 text-sm font-semibold text-slate-600">
              Esta sociedad ya fue iniciada o no tienes permiso para editarla.
            </Text>
          ) : null}
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Nombre" value={formulario.nombre} onChangeText={(valor) => actualizar('nombre', valor)} editable={puedeEditar} />
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Monto de cuota" keyboardType="numeric" value={formulario.montoCuota} onChangeText={(valor) => actualizar('montoCuota', valor)} editable={puedeEditar} />
          <Selector titulo="Moneda" opciones={['DOP', 'USD']} valor={formulario.moneda} onChange={(valor) => actualizar('moneda', valor as Moneda)} disabled={!puedeEditar} />
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Cantidad de participantes" keyboardType="numeric" value={formulario.cantidadParticipantes} onChangeText={(valor) => actualizar('cantidadParticipantes', valor)} editable={puedeEditar} />
          <CalendarDatePicker label="Fecha de inicio" value={formulario.fechaInicio} onChange={(valor) => actualizar('fechaInicio', valor)} disabled={!puedeEditar} />
          <Selector titulo="Frecuencia" opciones={['SEMANAL', 'QUINCENAL', 'MENSUAL']} valor={formulario.frecuencia} onChange={(valor) => actualizar('frecuencia', valor as Frecuencia)} disabled={!puedeEditar} />
          <Selector titulo="Turnos" opciones={['MANUAL', 'ALEATORIA']} valor={formulario.modalidadTurnos} onChange={(valor) => actualizar('modalidadTurnos', valor as Modalidad)} disabled={!puedeEditar} />
          <Selector titulo="Tipo de pago" opciones={['EFECTIVO', 'DEPOSITO_BANCARIO', 'TRANSFERENCIA', 'MIXTO']} valor={formulario.tipoPago} onChange={(valor) => actualizar('tipoPago', valor as TipoPago)} disabled={!puedeEditar} />
          {error ? <Text className="text-sm font-semibold text-red-600">{error}</Text> : null}
          <AppButton titulo={actualizarMutation.isPending ? 'Guardando...' : 'Guardar cambios'} disabled={actualizarMutation.isPending || !puedeEditar} onPress={enviar} />
        </View>
      </ScreenScrollView>
    </>
  );
}

function Selector({
  titulo,
  opciones,
  valor,
  onChange,
  disabled,
}: {
  titulo: string;
  opciones: string[];
  valor: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
}) {
  return (
    <View className="gap-2">
      <Text className="font-semibold text-marca-texto">{titulo}</Text>
      <View className="flex-row flex-wrap gap-2">
        {opciones.map((opcion) => {
          const activo = opcion === valor;
          return (
            <Pressable
              key={opcion}
              className={`rounded-lg border px-3 py-3 ${
                disabled ? 'border-slate-200 bg-slate-100' : activo ? 'border-marca-verde bg-emerald-50' : 'border-slate-200 bg-white'
              }`}
              onPress={() => onChange(opcion)}
              disabled={disabled}
            >
              <Text className={`text-sm font-semibold ${disabled ? 'text-slate-400' : activo ? 'text-marca-verde' : 'text-slate-600'}`}>{opcion}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
