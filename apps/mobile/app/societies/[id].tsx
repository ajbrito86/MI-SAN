import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { formatearMonto } from '@/lib/moneda';
import { getPublicFileUrl } from '@/services/api';
import { confirmarPago, listarMisPagos, listarPagosSociedad, rechazarPago } from '@/services/pagos-service';
import {
  cerrarSociedad,
  crearCiclo,
  crearInvitacion,
  entregarTurno,
  expulsarParticipante,
  finalizarCiclo,
  generarTurnosAleatorios,
  generarTurnosManuales,
  iniciarCiclo,
  listarHistorial,
  listarParticipantes,
  listarTurnos,
  obtenerResumenSociedad,
  obtenerSociedad,
} from '@/services/sociedades-service';
import { useAuthStore } from '@/stores/auth-store';

export default function DetalleSociedad() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const usuarioActual = useAuthStore((state) => state.usuario);
  const queryClient = useQueryClient();
  const [contactoInvitado, setContactoInvitado] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');
  const [pagoEnRechazo, setPagoEnRechazo] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [participanteEnExpulsion, setParticipanteEnExpulsion] = useState<string | null>(null);
  const [motivoExpulsion, setMotivoExpulsion] = useState('');
  const [ordenManual, setOrdenManual] = useState<string[]>([]);
  const [evidenciaVistaPrevia, setEvidenciaVistaPrevia] = useState<{ nombre: string; url: string } | null>(null);

  const {
    data: sociedad,
    isLoading: sociedadCargando,
    isError: sociedadError,
    refetch: recargarSociedad,
  } = useQuery({
    queryKey: ['sociedad', id],
    queryFn: () => obtenerSociedad(token ?? '', id),
    enabled: Boolean(token && id),
  });
  const { data: participantes = [] } = useQuery({
    queryKey: ['participantes', id],
    queryFn: () => listarParticipantes(token ?? '', id),
    enabled: Boolean(token && id),
  });
  const { data: historial = [] } = useQuery({
    queryKey: ['historial', id],
    queryFn: () => listarHistorial(token ?? '', id),
    enabled: Boolean(token && id),
  });
  const { data: resumen } = useQuery({
    queryKey: ['reporte-sociedad', id],
    queryFn: () => obtenerResumenSociedad(token ?? '', id),
    enabled: Boolean(token && id),
  });
  const { data: turnos = [] } = useQuery({
    queryKey: ['turnos', sociedad?.cicloActual?.id],
    queryFn: () => listarTurnos(token ?? '', sociedad?.cicloActual?.id ?? ''),
    enabled: Boolean(token && sociedad?.cicloActual?.id),
  });
  const { data: pagosSociedad = [] } = useQuery({
    queryKey: ['pagos-sociedad', id],
    queryFn: () => listarPagosSociedad(token ?? '', id),
    enabled: Boolean(token && id && sociedad?.rol === 'ORGANIZADOR'),
  });
  const { data: misPagos = [] } = useQuery({
    queryKey: ['mis-pagos'],
    queryFn: () => listarMisPagos(token ?? ''),
    enabled: Boolean(token),
  });
  const esOrganizador = sociedad?.rol === 'ORGANIZADOR';
  const puedeInvitar = sociedad?.estado === 'CONFIGURACION';
  const chatDisponible = sociedad?.estado !== 'FINALIZADA' && sociedad?.estado !== 'CANCELADA';
  const participantesOrdenables = useMemo(
    () => participantes.filter((participante) => participante.estadoParticipante === 'ACTIVO'),
    [participantes],
  );
  const participantesOrdenablesKey = participantesOrdenables.map((participante) => participante.id).join('|');
  const participantesActivos = participantesOrdenables.length;
  const montoEntregaEstimado = sociedad ? sociedad.montoCuota * participantesActivos : 0;
  const cuotasPorParticipante = turnos.length > 0 ? turnos.length : participantesActivos;
  const participantesConTurnoOrdenados = useMemo(
    () =>
      participantes
        .map((participante) => ({
          participante,
          turno: turnos.find((item) => item.participante.id === participante.usuario.id),
        }))
        .sort((a, b) => {
          if (a.turno && b.turno) {
            return a.turno.numeroTurno - b.turno.numeroTurno;
          }

          if (a.turno) {
            return -1;
          }

          if (b.turno) {
            return 1;
          }

          return `${a.participante.usuario.nombres} ${a.participante.usuario.apellidos}`.localeCompare(
            `${b.participante.usuario.nombres} ${b.participante.usuario.apellidos}`,
          );
        }),
    [participantes, turnos],
  );
  const misPagosSociedad = misPagos.filter((pago) => pago.sociedad.id === id);
  const miTurno = turnos.find((turno) => turno.participante.id === usuarioActual?.id);
  const misPagosConfirmados = misPagosSociedad.filter((pago) => pago.estado === 'CONFIRMADO');
  const misPagosPendientes = misPagosSociedad.filter((pago) => ['PENDIENTE', 'REPORTADO', 'RECHAZADO', 'ATRASADO', 'INCUMPLIDO'].includes(pago.estado));
  const totalPagado = misPagosConfirmados.reduce((total, pago) => total + pago.monto, 0);
  const totalPendiente = misPagosPendientes.reduce((total, pago) => total + pago.monto, 0);
  const proximoPago = [...misPagosPendientes].sort(
    (a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime(),
  )[0];

  useEffect(() => {
    const idsActivos = participantesOrdenables.map((participante) => participante.id);
    setOrdenManual((ordenActual) => {
      const ordenLimpio = ordenActual.filter((participanteId) => idsActivos.includes(participanteId));
      const nuevos = idsActivos.filter((participanteId) => !ordenLimpio.includes(participanteId));
      const siguienteOrden = [...ordenLimpio, ...nuevos];

      if (siguienteOrden.length === ordenActual.length && siguienteOrden.every((participanteId, index) => participanteId === ordenActual[index])) {
        return ordenActual;
      }

      return siguienteOrden;
    });
  }, [participantesOrdenablesKey]);

  const moverTurnoManual = (participanteId: string, direccion: -1 | 1) => {
    setOrdenManual((ordenActual) => {
      const indice = ordenActual.indexOf(participanteId);
      const nuevoIndice = indice + direccion;

      if (indice < 0 || nuevoIndice < 0 || nuevoIndice >= ordenActual.length) {
        return ordenActual;
      }

      const nuevoOrden = [...ordenActual];
      [nuevoOrden[indice], nuevoOrden[nuevoIndice]] = [nuevoOrden[nuevoIndice], nuevoOrden[indice]];
      return nuevoOrden;
    });
  };

  const participantePorId = (participanteId: string) => participantesOrdenables.find((participante) => participante.id === participanteId);
  const obtenerResumenEntrega = (numeroTurno: number) => {
    const pagosDelTurno = pagosSociedad.filter((pago) => pago.numeroCuota === numeroTurno);
    const pagosConfirmados = pagosDelTurno.filter((pago) => pago.estado === 'CONFIRMADO');
    const montoConfirmado = pagosConfirmados.reduce((total, pago) => total + pago.monto, 0);

    return {
      pagosConfirmados: pagosConfirmados.length,
      montoConfirmado,
      entregaCompleta: pagosConfirmados.length >= participantesActivos && montoConfirmado >= montoEntregaEstimado,
    };
  };
  const registrarEntregaConValidacion = (turno: { id: string; numeroTurno: number; montoCobro: number }) => {
    const resumenEntrega = obtenerResumenEntrega(turno.numeroTurno);

    if (resumenEntrega.entregaCompleta) {
      entregarTurnoMutation.mutate({ turnoId: turno.id });
      return;
    }

    Alert.alert(
      'Entrega incompleta',
      `Solo hay ${formatearMonto(resumenEntrega.montoConfirmado, sociedad?.moneda)} confirmado de ${formatearMonto(turno.montoCobro, sociedad?.moneda)} planificado. Si continuas, el turno quedara entregado con el monto real confirmado y marcado como incompleto.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Entregar incompleto',
          style: 'destructive',
          onPress: () => entregarTurnoMutation.mutate({ turnoId: turno.id, permitirEntregaIncompleta: true }),
        },
      ],
    );
  };
  const invalidarSociedad = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sociedad', id] }),
      queryClient.invalidateQueries({ queryKey: ['participantes', id] }),
      queryClient.invalidateQueries({ queryKey: ['historial', id] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-sociedad', id] }),
      queryClient.invalidateQueries({ queryKey: ['turnos'] }),
      queryClient.invalidateQueries({ queryKey: ['sociedades'] }),
    ]);
  };
  const invitarMutation = useMutation({
    mutationFn: () => {
      const contacto = contactoInvitado.trim();
      return crearInvitacion(
        token ?? '',
        id,
        contacto.includes('@') ? { emailInvitado: contacto } : { telefonoInvitado: contacto },
      );
    },
    onSuccess: async () => {
      setContactoInvitado('');
      setMensajeAccion('Invitacion enviada.');
      await invalidarSociedad();
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos enviar la invitacion.'),
  });
  const crearCicloMutation = useMutation({
    mutationFn: () => crearCiclo(token ?? '', id),
    onSuccess: async () => {
      setMensajeAccion('Ciclo creado.');
      await invalidarSociedad();
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos crear el ciclo.'),
  });
  const generarTurnosMutation = useMutation({
    mutationFn: () => generarTurnosAleatorios(token ?? '', sociedad?.cicloActual?.id ?? ''),
    onSuccess: async () => {
      setMensajeAccion('Turnos generados.');
      await invalidarSociedad();
      await queryClient.invalidateQueries({ queryKey: ['turnos', sociedad?.cicloActual?.id] });
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos generar los turnos.'),
  });
  const generarTurnosManualesMutation = useMutation({
    mutationFn: () =>
      generarTurnosManuales(
        token ?? '',
        sociedad?.cicloActual?.id ?? '',
        ordenManual.map((participanteId, index) => ({ participanteId, numeroTurno: index + 1 })),
      ),
    onSuccess: async () => {
      setMensajeAccion('Turnos manuales guardados.');
      await invalidarSociedad();
      await queryClient.invalidateQueries({ queryKey: ['turnos', sociedad?.cicloActual?.id] });
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos guardar los turnos manuales.'),
  });
  const iniciarCicloMutation = useMutation({
    mutationFn: () => iniciarCiclo(token ?? '', sociedad?.cicloActual?.id ?? ''),
    onSuccess: async () => {
      setMensajeAccion('Ciclo iniciado.');
      await invalidarSociedad();
      await queryClient.invalidateQueries({ queryKey: ['mis-pagos'] });
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos iniciar el ciclo.'),
  });
  const confirmarPagoMutation = useMutation({
    mutationFn: (cuotaPagoId: string) => confirmarPago(token ?? '', cuotaPagoId),
    onSuccess: async () => {
      setMensajeAccion('Pago confirmado.');
      await queryClient.invalidateQueries({ queryKey: ['pagos-sociedad', id] });
      await queryClient.invalidateQueries({ queryKey: ['reporte-sociedad', id] });
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos confirmar el pago.'),
  });
  const rechazarPagoMutation = useMutation({
    mutationFn: ({ cuotaPagoId, observacion }: { cuotaPagoId: string; observacion: string }) =>
      rechazarPago(token ?? '', cuotaPagoId, observacion),
    onSuccess: async () => {
      setMensajeAccion('Pago rechazado.');
      setPagoEnRechazo(null);
      setMotivoRechazo('');
      await queryClient.invalidateQueries({ queryKey: ['pagos-sociedad', id] });
      await queryClient.invalidateQueries({ queryKey: ['reporte-sociedad', id] });
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos rechazar el pago.'),
  });
  const entregarTurnoMutation = useMutation({
    mutationFn: ({ turnoId, permitirEntregaIncompleta }: { turnoId: string; permitirEntregaIncompleta?: boolean }) =>
      entregarTurno(token ?? '', sociedad?.cicloActual?.id ?? '', turnoId, Boolean(permitirEntregaIncompleta)),
    onSuccess: async () => {
      setMensajeAccion('Turno registrado como entregado.');
      await queryClient.invalidateQueries({ queryKey: ['turnos', sociedad?.cicloActual?.id] });
      await queryClient.invalidateQueries({ queryKey: ['historial', id] });
      await queryClient.invalidateQueries({ queryKey: ['reporte-sociedad', id] });
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos registrar la entrega.'),
  });
  const expulsarParticipanteMutation = useMutation({
    mutationFn: ({ participanteId, motivo }: { participanteId: string; motivo: string }) =>
      expulsarParticipante(token ?? '', participanteId, motivo),
    onSuccess: async () => {
      setMensajeAccion('Participante expulsado.');
      setParticipanteEnExpulsion(null);
      setMotivoExpulsion('');
      await invalidarSociedad();
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos expulsar el participante.'),
  });
  const finalizarCicloMutation = useMutation({
    mutationFn: () => finalizarCiclo(token ?? '', sociedad?.cicloActual?.id ?? ''),
    onSuccess: async () => {
      setMensajeAccion('Ciclo finalizado.');
      await invalidarSociedad();
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos finalizar el ciclo.'),
  });
  const cerrarSociedadMutation = useMutation({
    mutationFn: () => cerrarSociedad(token ?? '', id),
    onSuccess: async () => {
      setMensajeAccion('Sociedad cerrada.');
      await invalidarSociedad();
    },
    onError: (err) => setMensajeAccion(err instanceof Error ? err.message : 'No pudimos cerrar la sociedad.'),
  });

  if (sociedadCargando) {
    return (
      <ScreenScrollView>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader titulo="Sociedad" subtitulo="Cargando detalle del SAN" mostrarAtras />
        <View className="mt-5">
          <AppCard titulo="Cargando" detalle="Buscando la informacion de esta sociedad." estado="PENDIENTE" />
        </View>
      </ScreenScrollView>
    );
  }

  if (sociedadError || !sociedad) {
    return (
      <ScreenScrollView>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader titulo="Sociedad" subtitulo="No pudimos cargar este SAN" mostrarAtras />
        <View className="mt-5 gap-3 rounded-lg bg-white p-4">
          <Text className="font-semibold text-red-600">No pudimos cargar el detalle de esta sociedad.</Text>
          <Text className="text-sm text-slate-600">Revisa tu conexion o vuelve a intentarlo en unos segundos.</Text>
          <AppButton titulo="Reintentar" variante="secundario" onPress={() => recargarSociedad()} />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <Stack.Screen options={{ headerShown: false }} />
      <Modal visible={Boolean(evidenciaVistaPrevia)} transparent animationType="fade" onRequestClose={() => setEvidenciaVistaPrevia(null)}>
        <View className="flex-1 justify-center bg-black/80 px-4">
          <View className="rounded-lg bg-white p-3">
            <Text className="mb-3 font-semibold text-marca-texto">{evidenciaVistaPrevia?.nombre}</Text>
            {evidenciaVistaPrevia ? (
              <Image
                source={{ uri: evidenciaVistaPrevia.url }}
                className="h-96 w-full rounded-lg bg-slate-100"
                resizeMode="contain"
              />
            ) : null}
            <View className="mt-3 gap-2">
              {evidenciaVistaPrevia ? (
                <AppButton
                  titulo="Abrir archivo"
                  variante="secundario"
                  onPress={() => Linking.openURL(evidenciaVistaPrevia.url)}
                />
              ) : null}
              <AppButton titulo="Cerrar" onPress={() => setEvidenciaVistaPrevia(null)} />
            </View>
          </View>
        </View>
      </Modal>
      <AppHeader titulo={sociedad?.nombre ?? 'Sociedad'} subtitulo={sociedad ? `${sociedad.estado} - ${sociedad.rol}` : 'Cargando...'} mostrarAtras />
      <View className="mt-5 gap-4 pb-8">
        {sociedad ? (
          <View className="rounded-lg bg-white p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-marca-texto">Resumen</Text>
                <Text className="mt-1 text-slate-600">Inicio: {new Date(sociedad.fechaInicio).toLocaleDateString()}</Text>
              </View>
              <Text className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-marca-verde">{sociedad.estado}</Text>
            </View>
            <View className="mt-4 gap-3">
              <View className="rounded-lg bg-slate-50 p-3">
                <Text className="text-xs font-bold uppercase text-slate-500">Cuota individual</Text>
                <Text className="mt-1 text-base font-semibold text-marca-texto">
                  {formatearMonto(sociedad.montoCuota, sociedad.moneda)} {sociedad.frecuencia.toLowerCase()} por participante
                </Text>
              </View>
              <View className="rounded-lg bg-emerald-50 p-3">
                <Text className="text-xs font-bold uppercase text-marca-verde">Entrega por turno</Text>
                <Text className="mt-1 text-xl font-bold text-marca-texto">
                  {formatearMonto(montoEntregaEstimado, sociedad.moneda)}
                </Text>
                <Text className="mt-1 text-sm text-slate-600">
                  {participantesActivos} participante(s) activos x {formatearMonto(sociedad.montoCuota, sociedad.moneda)}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-lg bg-slate-50 p-3">
                  <Text className="text-xs font-bold uppercase text-slate-500">Participantes</Text>
                  <Text className="mt-1 font-semibold text-marca-texto">
                    {participantesActivos}/{sociedad.cantidadParticipantes} activos
                  </Text>
                </View>
                <View className="flex-1 rounded-lg bg-slate-50 p-3">
                  <Text className="text-xs font-bold uppercase text-slate-500">Cuotas por persona</Text>
                  <Text className="mt-1 font-semibold text-marca-texto">{cuotasPorParticipante}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {resumen ? (
          <View className="rounded-lg bg-white p-4">
            <Text className="text-lg font-semibold text-marca-texto">Reporte</Text>
            <Text className="mt-2 text-slate-600">Total confirmado: {formatearMonto(resumen.totalConfirmado, resumen.moneda)}</Text>
            <Text className="mt-1 text-slate-600">Pagos confirmados: {resumen.pagosConfirmados}</Text>
            <View className="mt-3 gap-2">
              {Object.entries(resumen.cuotasPorEstado).map(([estado, datos]) => (
                <Text key={estado} className="text-slate-700">
                  {estado}: {datos.cantidad} cuota(s), {formatearMonto(datos.monto, resumen.moneda)}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {esOrganizador && resumen?.participantesResumen?.length ? (
          <View className="rounded-lg bg-white p-4">
            <Text className="text-lg font-semibold text-marca-texto">Estado por participante</Text>
            <View className="mt-3 gap-3">
              {resumen.participantesResumen.map((item) => {
                const tieneAtraso = item.cuotasAtrasadas > 0;
                const estaAlDia = item.cuotasAtrasadas === 0 && item.cuotasPendientes === 0;

                return (
                  <View key={item.participanteId} className="rounded-lg border border-slate-100 p-3">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="font-semibold text-marca-texto">
                          {item.usuario.nombres} {item.usuario.apellidos}
                        </Text>
                        <Text className="mt-1 text-sm text-slate-600">
                          Pagado: {formatearMonto(item.totalConfirmado, resumen.moneda)}
                        </Text>
                      </View>
                      <Text
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          tieneAtraso
                            ? 'bg-red-50 text-red-700'
                            : estaAlDia
                              ? 'bg-emerald-50 text-marca-verde'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {tieneAtraso ? 'ATRASADO' : estaAlDia ? 'AL DIA' : 'PENDIENTE'}
                      </Text>
                    </View>
                    <View className="mt-3 flex-row gap-2">
                      <View className="flex-1 rounded-lg bg-red-50 p-2">
                        <Text className="text-xs font-bold uppercase text-red-700">Atrasado</Text>
                        <Text className="mt-1 text-sm font-semibold text-marca-texto">
                          {item.cuotasAtrasadas} / {formatearMonto(item.totalAtrasado, resumen.moneda)}
                        </Text>
                      </View>
                      <View className="flex-1 rounded-lg bg-amber-50 p-2">
                        <Text className="text-xs font-bold uppercase text-amber-700">Pendiente</Text>
                        <Text className="mt-1 text-sm font-semibold text-marca-texto">
                          {item.cuotasPendientes} / {formatearMonto(item.totalPendiente, resumen.moneda)}
                        </Text>
                      </View>
                      <View className="flex-1 rounded-lg bg-emerald-50 p-2">
                        <Text className="text-xs font-bold uppercase text-marca-verde">Ok</Text>
                        <Text className="mt-1 text-sm font-semibold text-marca-texto">{item.cuotasConfirmadas}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {sociedad && (miTurno || misPagosSociedad.length > 0) ? (
          <View className="rounded-lg bg-white p-4">
            <Text className="text-lg font-semibold text-marca-texto">Mi estado en este SAN</Text>
            <View className="mt-3 gap-3">
              <View className="rounded-lg bg-slate-50 p-3">
                <Text className="text-xs font-bold uppercase text-slate-500">Mi turno</Text>
                {miTurno ? (
                  <>
                    <Text className="mt-1 font-semibold text-marca-texto">
                      #{miTurno.numeroTurno} -{' '}
                      {miTurno.montoEntregado !== null
                        ? `recibido ${formatearMonto(miTurno.montoEntregado, sociedad.moneda)}`
                        : `entrega planificada ${formatearMonto(miTurno.montoCobro, sociedad.moneda)}`}
                    </Text>
                    {miTurno.entregaIncompleta ? (
                      <Text className="mt-1 text-sm font-semibold text-amber-700">
                        Entrega incompleta. Planificado: {formatearMonto(miTurno.montoCobro, sociedad.moneda)}
                      </Text>
                    ) : null}
                    <Text className="mt-1 text-sm text-slate-600">
                      Fecha prevista: {new Date(miTurno.fechaProgramada).toLocaleDateString()}
                    </Text>
                    <Text className={`mt-1 text-sm font-semibold ${miTurno.estado === 'PAGADO' ? 'text-marca-verde' : 'text-slate-600'}`}>
                      {miTurno.estado === 'PAGADO' ? 'Entrega registrada' : 'Pendiente de entrega'}
                    </Text>
                  </>
                ) : (
                  <Text className="mt-1 text-slate-600">Aun no tienes turno asignado.</Text>
                )}
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-lg bg-emerald-50 p-3">
                  <Text className="text-xs font-bold uppercase text-marca-verde">Pagado</Text>
                  <Text className="mt-1 font-semibold text-marca-texto">{formatearMonto(totalPagado, sociedad.moneda)}</Text>
                  <Text className="mt-1 text-xs text-slate-600">{misPagosConfirmados.length} cuota(s)</Text>
                </View>
                <View className="flex-1 rounded-lg bg-amber-50 p-3">
                  <Text className="text-xs font-bold uppercase text-amber-700">Pendiente</Text>
                  <Text className="mt-1 font-semibold text-marca-texto">{formatearMonto(totalPendiente, sociedad.moneda)}</Text>
                  <Text className="mt-1 text-xs text-slate-600">{misPagosPendientes.length} cuota(s)</Text>
                </View>
              </View>
              {proximoPago ? (
                <View className="rounded-lg bg-slate-50 p-3">
                  <Text className="text-xs font-bold uppercase text-slate-500">Proximo pago</Text>
                  <Text className="mt-1 font-semibold text-marca-texto">
                    Cuota #{proximoPago.numeroCuota} - {formatearMonto(proximoPago.monto, sociedad.moneda)}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-600">
                    Vence {new Date(proximoPago.fechaVencimiento).toLocaleDateString()} - {proximoPago.estado}
                  </Text>
                </View>
              ) : misPagosSociedad.length > 0 ? (
                <Text className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-marca-verde">
                  No tienes cuotas pendientes en este SAN.
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {esOrganizador ? (
          <View className="rounded-lg bg-white p-4">
            <Text className="text-lg font-semibold text-marca-texto">Acciones</Text>
            {mensajeAccion ? <Text className="mt-2 text-sm font-semibold text-marca-verde">{mensajeAccion}</Text> : null}
            <View className="mt-4 gap-3">
              {sociedad?.estado === 'CONFIGURACION' ? (
                <AppButton
                  titulo="Editar sociedad"
                  variante="secundario"
                  onPress={() => router.push({ pathname: '/societies/[id]/edit', params: { id } } as never)}
                />
              ) : null}
              <TextInput
                className={`rounded-lg border px-4 py-4 text-base ${
                  puedeInvitar ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-100 text-slate-400'
                }`}
                placeholder="Telefono o correo del invitado"
                placeholderTextColor={puedeInvitar ? '#94A3B8' : '#CBD5E1'}
                autoCapitalize="none"
                value={contactoInvitado}
                onChangeText={setContactoInvitado}
                editable={puedeInvitar}
              />
              <AppButton
                titulo={invitarMutation.isPending ? 'Enviando...' : 'Invitar participante'}
                onPress={() => invitarMutation.mutate()}
                disabled={invitarMutation.isPending || !contactoInvitado.trim() || !puedeInvitar}
              />
              {!puedeInvitar ? (
                <Text className="text-sm font-semibold text-slate-600">
                  Este san ya inicio y esta cerrado para nuevos invitados.
                </Text>
              ) : null}
              {!sociedad?.cicloActual || sociedad.cicloActual.estado === 'COMPLETADO' || sociedad.cicloActual.estado === 'CANCELADO' ? (
                <AppButton
                  titulo={crearCicloMutation.isPending ? 'Creando...' : sociedad?.cicloActual ? 'Crear nuevo ciclo' : 'Crear ciclo'}
                  variante="secundario"
                  onPress={() => crearCicloMutation.mutate()}
                  disabled={crearCicloMutation.isPending}
                />
              ) : null}
              {sociedad?.cicloActual && sociedad.cicloActual.estado === 'CONFIGURACION' ? (
                <>
                  <View className="gap-3 rounded-lg bg-slate-50 p-3">
                    <View>
                      <Text className="font-semibold text-marca-texto">Orden manual de turnos</Text>
                      <Text className="mt-1 text-sm text-slate-600">
                        Ajusta el orden antes de iniciar el ciclo. El turno #1 cobra primero.
                      </Text>
                    </View>
                    {ordenManual.length === 0 ? (
                      <Text className="text-sm text-slate-600">Agrega participantes activos para ordenar turnos.</Text>
                    ) : (
                      <View className="gap-2">
                        {ordenManual.map((participanteId, index) => {
                          const participante = participantePorId(participanteId);

                          if (!participante) {
                            return null;
                          }

                          return (
                            <View key={participanteId} className="flex-row items-center gap-2 rounded-lg bg-white p-3">
                              <Text className="w-8 text-base font-bold text-marca-verde">#{index + 1}</Text>
                              <View className="flex-1">
                                <Text className="font-semibold text-marca-texto">
                                  {participante.usuario.nombres} {participante.usuario.apellidos}
                                </Text>
                                <Text className="text-xs text-slate-500">
                                  Entrega {formatearMonto(montoEntregaEstimado, sociedad.moneda)}
                                </Text>
                              </View>
                              <View className="flex-row gap-2">
                                <Pressable
                                  className={`h-10 w-10 items-center justify-center rounded-lg border ${
                                    index === 0 || generarTurnosManualesMutation.isPending
                                      ? 'border-slate-200 bg-slate-100'
                                      : 'border-marca-verde bg-white'
                                  }`}
                                  onPress={() => moverTurnoManual(participanteId, -1)}
                                  disabled={index === 0 || generarTurnosManualesMutation.isPending}
                                >
                                  <Text
                                    className={`text-lg font-bold ${
                                      index === 0 || generarTurnosManualesMutation.isPending ? 'text-slate-400' : 'text-marca-verde'
                                    }`}
                                  >
                                    ^
                                  </Text>
                                </Pressable>
                                <Pressable
                                  className={`h-10 w-10 items-center justify-center rounded-lg border ${
                                    index === ordenManual.length - 1 || generarTurnosManualesMutation.isPending
                                      ? 'border-slate-200 bg-slate-100'
                                      : 'border-marca-verde bg-white'
                                  }`}
                                  onPress={() => moverTurnoManual(participanteId, 1)}
                                  disabled={index === ordenManual.length - 1 || generarTurnosManualesMutation.isPending}
                                >
                                  <Text
                                    className={`text-lg font-bold ${
                                      index === ordenManual.length - 1 || generarTurnosManualesMutation.isPending ? 'text-slate-400' : 'text-marca-verde'
                                    }`}
                                  >
                                    v
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                    <AppButton
                      titulo={generarTurnosManualesMutation.isPending ? 'Guardando...' : 'Guardar orden manual'}
                      variante="secundario"
                      onPress={() => generarTurnosManualesMutation.mutate()}
                      disabled={
                        generarTurnosManualesMutation.isPending ||
                        ordenManual.length !== participantesActivos ||
                        participantesActivos < 2
                      }
                    />
                  </View>
                  <AppButton
                    titulo={generarTurnosMutation.isPending ? 'Generando...' : 'Generar turnos aleatorios'}
                    variante="secundario"
                    onPress={() => generarTurnosMutation.mutate()}
                    disabled={generarTurnosMutation.isPending}
                  />
                  <AppButton
                    titulo={iniciarCicloMutation.isPending ? 'Iniciando...' : 'Iniciar ciclo'}
                    onPress={() =>
                      Alert.alert(
                        'Cerrar entrada de invitados',
                        `Al iniciar el ciclo, este san quedara cerrado para nuevos invitados. Se usaran ${participantesActivos} participantes activos: cada cuota sera de ${formatearMonto(sociedad.montoCuota, sociedad.moneda)} y cada entrega sera de ${formatearMonto(montoEntregaEstimado, sociedad.moneda)}. Quien no haya entrado debera esperar al proximo ciclo o participar en otro san.`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Iniciar y cerrar entradas', style: 'destructive', onPress: () => iniciarCicloMutation.mutate() },
                        ],
                      )
                    }
                    disabled={iniciarCicloMutation.isPending}
                  />
                </>
              ) : null}
              {sociedad?.cicloActual?.estado === 'ACTIVO' ? (
                <AppButton
                  titulo={finalizarCicloMutation.isPending ? 'Finalizando...' : 'Finalizar ciclo'}
                  variante="secundario"
                  onPress={() =>
                    Alert.alert('Finalizar ciclo', 'Esta accion marca el ciclo como completado. Deben estar registradas todas las entregas del ciclo.', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Finalizar', style: 'destructive', onPress: () => finalizarCicloMutation.mutate() },
                    ])
                  }
                  disabled={finalizarCicloMutation.isPending}
                />
              ) : null}
              {sociedad?.estado !== 'FINALIZADA' && sociedad?.estado !== 'CANCELADA' ? (
                <AppButton
                  titulo={cerrarSociedadMutation.isPending ? 'Cerrando...' : 'Cerrar sociedad'}
                  variante="secundario"
                  onPress={() =>
                    Alert.alert('Cerrar sociedad', 'La sociedad quedara solo para consulta y no podra operarse nuevamente.', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Cerrar sociedad', style: 'destructive', onPress: () => cerrarSociedadMutation.mutate() },
                    ])
                  }
                  disabled={cerrarSociedadMutation.isPending}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        <View className="rounded-lg bg-white p-4">
          <Text className="text-lg font-semibold text-marca-texto">Participantes y turnos</Text>
          <View className="mt-3 gap-3">
            {participantesConTurnoOrdenados.map(({ participante, turno }) => {
              const esOrganizadorEnSuPropiaFila = esOrganizador && participante.usuario.id === usuarioActual?.id;
              const puedeChatear =
                chatDisponible &&
                participante.estadoParticipante === 'ACTIVO' &&
                !esOrganizadorEnSuPropiaFila &&
                (esOrganizador || participante.usuario.id === usuarioActual?.id);

              return (
                <View key={participante.id} className="gap-2 border-b border-slate-100 pb-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-semibold text-marca-texto">
                        {turno ? `#${turno.numeroTurno} - ` : ''}
                        {participante.usuario.nombres} {participante.usuario.apellidos}
                      </Text>
                      {turno ? (
                        <>
                          <Text className="font-semibold text-slate-700">
                            {turno.montoEntregado !== null
                              ? `Entregado: ${formatearMonto(turno.montoEntregado, sociedad?.moneda)}`
                              : `Entrega planificada: ${formatearMonto(turno.montoCobro, sociedad?.moneda)}`}
                          </Text>
                          {turno.montoEntregado !== null && turno.montoEntregado !== turno.montoCobro ? (
                            <Text className="text-sm font-semibold text-amber-700">
                              Planificado: {formatearMonto(turno.montoCobro, sociedad?.moneda)}
                            </Text>
                          ) : null}
                          <Text className="text-slate-600">
                            Fecha prevista: {new Date(turno.fechaProgramada).toLocaleDateString()}
                          </Text>
                          {turno.fechaEntrega ? (
                            <Text className="font-semibold text-marca-verde">
                              Entregado el {new Date(turno.fechaEntrega).toLocaleDateString()}
                            </Text>
                          ) : null}
                        </>
                      ) : (
                        <Text className="text-slate-600">Sin turno asignado</Text>
                      )}
                    </View>
                    <View className="items-end gap-2">
                      <Text
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          participante.estadoParticipante === 'ACTIVO'
                            ? 'bg-emerald-50 text-marca-verde'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {participante.estadoParticipante}
                      </Text>
                      {turno ? (
                        <Text
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            turno.entregaIncompleta
                              ? 'bg-amber-50 text-amber-700'
                              : turno.estado === 'PAGADO'
                                ? 'bg-emerald-50 text-marca-verde'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {turno.entregaIncompleta ? 'INCOMPLETO' : turno.estado === 'PAGADO' ? 'ENTREGADO' : 'PENDIENTE'}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {esOrganizador && sociedad?.cicloActual?.estado === 'ACTIVO' && turno && turno.estado !== 'PAGADO' ? (
                    <AppButton
                      titulo={entregarTurnoMutation.isPending ? 'Registrando...' : 'Registrar entrega'}
                      variante="secundario"
                      onPress={() => registrarEntregaConValidacion(turno)}
                      disabled={entregarTurnoMutation.isPending}
                    />
                  ) : null}
                  {puedeChatear ? (
                    <AppButton
                      titulo={esOrganizador ? 'Chat privado' : 'Chat con organizador'}
                      variante="secundario"
                      onPress={() =>
                        router.push({
                          pathname: '/societies/[id]/chat/[participanteId]',
                          params: {
                            id,
                            participanteId: participante.id,
                            nombre: `${participante.usuario.nombres} ${participante.usuario.apellidos}`,
                          },
                        })
                      }
                    />
                  ) : null}
                  {esOrganizador && sociedad?.estado === 'CONFIGURACION' && participante.usuario.id !== usuarioActual?.id ? (
                    <View className="mt-1 gap-2">
                      {participanteEnExpulsion === participante.id ? (
                        <>
                          <TextInput
                            className="min-h-20 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base"
                            placeholder="Motivo de expulsion"
                            multiline
                            value={motivoExpulsion}
                            onChangeText={setMotivoExpulsion}
                          />
                          <AppButton
                            titulo={expulsarParticipanteMutation.isPending ? 'Expulsando...' : 'Confirmar expulsion'}
                            variante="secundario"
                            onPress={() =>
                              expulsarParticipanteMutation.mutate({
                                participanteId: participante.id,
                                motivo: motivoExpulsion.trim(),
                              })
                            }
                            disabled={expulsarParticipanteMutation.isPending || !motivoExpulsion.trim()}
                          />
                          <AppButton
                            titulo="Cancelar expulsion"
                            variante="secundario"
                            onPress={() => {
                              setParticipanteEnExpulsion(null);
                              setMotivoExpulsion('');
                            }}
                            disabled={expulsarParticipanteMutation.isPending}
                          />
                        </>
                      ) : (
                        <AppButton
                          titulo="Expulsar participante"
                          variante="secundario"
                          onPress={() => {
                            setParticipanteEnExpulsion(participante.id);
                            setMotivoExpulsion('');
                          }}
                        />
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {esOrganizador ? (
          <View className="rounded-lg bg-white p-4">
            <Text className="text-lg font-semibold text-marca-texto">Pagos reportados</Text>
            <View className="mt-3 gap-4">
              {pagosSociedad.filter((pago) => pago.estado === 'REPORTADO').length === 0 ? (
                <Text className="text-slate-600">No hay pagos reportados pendientes de revision.</Text>
              ) : (
                pagosSociedad
                  .filter((pago) => pago.estado === 'REPORTADO')
                  .map((pago) => {
                    const requiereComprobante = pago.metodoPagoReportado !== 'EFECTIVO';

                    return (
                    <View key={pago.id} className="gap-2 border-b border-slate-100 pb-4">
                      <Text className="font-semibold text-marca-texto">
                        {pago.participante.nombres} {pago.participante.apellidos} - cuota #{pago.numeroCuota}
                      </Text>
                      <Text className="text-slate-600">{formatearMonto(pago.monto, pago.sociedad.moneda)}</Text>
                      <Text className="text-sm font-semibold text-slate-600">
                        Metodo: {pago.metodoPagoReportado === 'EFECTIVO' ? 'Efectivo' : pago.metodoPagoReportado === 'TRANSFERENCIA' ? 'Transferencia' : 'Deposito'}
                      </Text>
                      {pago.evidencias.length > 0 ? (
                        <View className="rounded-lg bg-emerald-50 p-3">
                          <Text className="text-sm font-semibold text-marca-texto">
                            {pago.evidencias.length} comprobante(s) adjunto(s)
                          </Text>
                          <View className="mt-3 gap-3">
                            {pago.evidencias.map((evidencia) => {
                              const urlEvidencia = getPublicFileUrl(evidencia.urlArchivo);
                              const esImagen = evidencia.mimeType.startsWith('image/');

                              return (
                                <View key={evidencia.id} className="rounded-lg border border-emerald-100 bg-white p-2">
                                  {esImagen ? (
                                    <Pressable onPress={() => setEvidenciaVistaPrevia({ nombre: evidencia.nombreArchivo, url: urlEvidencia })}>
                                      <Image
                                        source={{ uri: urlEvidencia }}
                                        className="h-48 w-full rounded-lg bg-slate-100"
                                        resizeMode="contain"
                                      />
                                      <Text className="mt-2 text-sm font-semibold text-marca-azul">
                                        Ver grande: {evidencia.nombreArchivo}
                                      </Text>
                                    </Pressable>
                                  ) : (
                                    <Text
                                      className="text-sm font-semibold text-marca-azul"
                                      onPress={() => Linking.openURL(urlEvidencia)}
                                    >
                                      Abrir archivo: {evidencia.nombreArchivo}
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      ) : (
                        <Text className="text-sm font-semibold text-red-600">Sin comprobante adjunto.</Text>
                      )}
                      <View className="gap-2">
                        <AppButton
                          titulo={confirmarPagoMutation.isPending ? 'Confirmando...' : 'Confirmar pago'}
                          onPress={() => confirmarPagoMutation.mutate(pago.id)}
                          disabled={
                            confirmarPagoMutation.isPending ||
                            rechazarPagoMutation.isPending ||
                            (requiereComprobante && pago.evidencias.length === 0)
                          }
                        />
                        {pagoEnRechazo === pago.id ? (
                          <View className="gap-2">
                            <TextInput
                              className="min-h-20 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base"
                              placeholder="Motivo del rechazo"
                              multiline
                              value={motivoRechazo}
                              onChangeText={setMotivoRechazo}
                            />
                            <AppButton
                              titulo={rechazarPagoMutation.isPending ? 'Rechazando...' : 'Enviar rechazo'}
                              variante="secundario"
                              onPress={() =>
                                rechazarPagoMutation.mutate({
                                  cuotaPagoId: pago.id,
                                  observacion: motivoRechazo.trim(),
                                })
                              }
                              disabled={confirmarPagoMutation.isPending || rechazarPagoMutation.isPending || !motivoRechazo.trim()}
                            />
                            <AppButton
                              titulo="Cancelar rechazo"
                              variante="secundario"
                              onPress={() => {
                                setPagoEnRechazo(null);
                                setMotivoRechazo('');
                              }}
                              disabled={rechazarPagoMutation.isPending}
                            />
                          </View>
                        ) : (
                          <AppButton
                            titulo="Rechazar pago"
                            variante="secundario"
                            onPress={() => {
                              setPagoEnRechazo(pago.id);
                              setMotivoRechazo('');
                            }}
                            disabled={confirmarPagoMutation.isPending || rechazarPagoMutation.isPending}
                          />
                        )}
                      </View>
                    </View>
                    );
                  })
              )}
            </View>
          </View>
        ) : null}

        <View className="rounded-lg bg-white p-4">
          <Text className="text-lg font-semibold text-marca-texto">Historial</Text>
          <View className="mt-3 gap-3">
            {historial.length === 0 ? (
              <Text className="text-slate-600">Aun no hay movimientos registrados en este SAN.</Text>
            ) : (
              historial.slice(0, 10).map((movimiento) => (
                <View key={movimiento.id} className="border-b border-slate-100 pb-3">
                  <Text className="font-semibold text-marca-texto">{movimiento.accion}</Text>
                  <Text className="text-slate-600">{movimiento.descripcion}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </ScreenScrollView>
  );
}
