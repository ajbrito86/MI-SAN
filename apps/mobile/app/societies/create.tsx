import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { CalendarDatePicker } from '@/components/calendar-date-picker';
import { AppHeader } from '@/components/app-header';
import { crearSociedad, type CrearSociedadPayload } from '@/services/sociedades-service';
import { useAuthStore } from '@/stores/auth-store';

type Frecuencia = CrearSociedadPayload['frecuencia'];
type Modalidad = CrearSociedadPayload['modalidadTurnos'];
type TipoPago = CrearSociedadPayload['tipoPago'];
type Moneda = CrearSociedadPayload['moneda'];

export default function CrearSociedad() {
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

  const crearMutation = useMutation({
    mutationFn: () =>
      crearSociedad(token ?? '', {
        nombre: formulario.nombre,
        montoCuota: Number(formulario.montoCuota),
        moneda: formulario.moneda,
        cantidadParticipantes: Number(formulario.cantidadParticipantes),
        fechaInicio: new Date(formulario.fechaInicio).toISOString(),
        frecuencia: formulario.frecuencia,
        modalidadTurnos: formulario.modalidadTurnos,
        tipoPago: formulario.tipoPago,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sociedades'] });
      router.replace('/(tabs)/societies');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'No pudimos guardar la sociedad.');
    },
  });

  function actualizar(campo: keyof typeof formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function enviar() {
    setError('');
    crearMutation.mutate();
  }

  return (
    <SafeAreaView className="flex-1 bg-marca-fondo">
      <ScrollView className="flex-1 px-5 pt-12" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="gap-4">
        <AppHeader titulo="Nueva sociedad" subtitulo="Crear una sociedad te convierte en organizador." mostrarAtras />
        <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Nombre" value={formulario.nombre} onChangeText={(valor) => actualizar('nombre', valor)} />
        <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Monto de cuota" keyboardType="numeric" value={formulario.montoCuota} onChangeText={(valor) => actualizar('montoCuota', valor)} />
        <Selector
          titulo="Moneda"
          opciones={['DOP', 'USD']}
          valor={formulario.moneda}
          onChange={(valor) => actualizar('moneda', valor as Moneda)}
        />
        <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Cantidad de participantes" keyboardType="numeric" value={formulario.cantidadParticipantes} onChangeText={(valor) => actualizar('cantidadParticipantes', valor)} />
        <CalendarDatePicker label="Fecha de inicio" value={formulario.fechaInicio} onChange={(valor) => actualizar('fechaInicio', valor)} />
        <Selector
          titulo="Frecuencia"
          opciones={['SEMANAL', 'QUINCENAL', 'MENSUAL']}
          valor={formulario.frecuencia}
          onChange={(valor) => actualizar('frecuencia', valor as Frecuencia)}
        />
        <Selector
          titulo="Turnos"
          opciones={['MANUAL', 'ALEATORIA']}
          valor={formulario.modalidadTurnos}
          onChange={(valor) => actualizar('modalidadTurnos', valor as Modalidad)}
        />
        <Selector
          titulo="Tipo de pago"
          opciones={['EFECTIVO', 'DEPOSITO_BANCARIO', 'TRANSFERENCIA', 'MIXTO']}
          valor={formulario.tipoPago}
          onChange={(valor) => actualizar('tipoPago', valor as TipoPago)}
        />
        {error ? <Text className="text-sm font-semibold text-red-600">{error}</Text> : null}
        <AppButton titulo={crearMutation.isPending ? 'Guardando...' : 'Guardar sociedad'} disabled={crearMutation.isPending} onPress={enviar} />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Selector({
  titulo,
  opciones,
  valor,
  onChange,
}: {
  titulo: string;
  opciones: string[];
  valor: string;
  onChange: (valor: string) => void;
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
              className={`rounded-lg border px-3 py-3 ${activo ? 'border-marca-verde bg-emerald-50' : 'border-slate-200 bg-white'}`}
              onPress={() => onChange(opcion)}
            >
              <Text className={`text-sm font-semibold ${activo ? 'text-marca-verde' : 'text-slate-600'}`}>{opcion}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
