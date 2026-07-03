import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { ScreenTopView } from '@/components/screen';
import { confirmarRecuperacionContrasena, solicitarRecuperacionContrasena } from '@/services/auth-service';

export default function RecuperarContrasena() {
  const [identificador, setIdentificador] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [codigoDev, setCodigoDev] = useState<string | null>(null);
  const [paso, setPaso] = useState<'solicitar' | 'confirmar'>('solicitar');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function solicitar() {
    setError('');
    setMensaje('');
    const identificadorLimpio = identificador.trim();

    if (!identificadorLimpio) {
      setError('Escribe tu telefono o correo.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await solicitarRecuperacionContrasena(identificadorLimpio);
      setMensaje(respuesta.mensaje);
      setCodigoDev(respuesta.codigoRecuperacion ?? null);
      setPaso('confirmar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar la recuperacion.');
    } finally {
      setCargando(false);
    }
  }

  async function confirmar() {
    setError('');
    setMensaje('');

    if (codigo.trim().length !== 6 || nuevaContrasena.length < 8) {
      setError('Escribe el codigo de 6 digitos y una contrasena de al menos 8 caracteres.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await confirmarRecuperacionContrasena({
        identificador: identificador.trim(),
        codigo: codigo.trim(),
        nuevaContrasena,
      });
      setMensaje(respuesta.mensaje);
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos actualizar tu contrasena.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScreenTopView className="flex-1 bg-marca-fondo">
      <View className="flex-1 justify-center gap-5">
        <AppHeader titulo="Recuperar contrasena" subtitulo="Solicita un codigo y crea una nueva contrasena." mostrarAtras />

        <View className="gap-3">
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base"
            placeholder="Telefono o correo"
            autoCapitalize="none"
            value={identificador}
            editable={paso === 'solicitar' && !cargando}
            onChangeText={setIdentificador}
          />

          {paso === 'confirmar' ? (
            <>
              <TextInput
                className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base"
                placeholder="Codigo de 6 digitos"
                keyboardType="number-pad"
                maxLength={6}
                value={codigo}
                onChangeText={setCodigo}
              />
              <TextInput
                className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base"
                placeholder="Nueva contrasena"
                secureTextEntry
                value={nuevaContrasena}
                onChangeText={setNuevaContrasena}
              />
            </>
          ) : null}

          {codigoDev ? <Text className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700">Codigo de prueba: {codigoDev}</Text> : null}
          {mensaje ? <Text className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-marca-verde">{mensaje}</Text> : null}
          {error ? <Text className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</Text> : null}

          <AppButton
            titulo={cargando ? 'Procesando...' : paso === 'solicitar' ? 'Enviar codigo' : 'Actualizar contrasena'}
            disabled={cargando}
            onPress={paso === 'solicitar' ? solicitar : confirmar}
          />
          {cargando ? <ActivityIndicator color="#168A5B" /> : null}

          {paso === 'confirmar' ? (
            <AppButton
              titulo="Solicitar otro codigo"
              variante="secundario"
              disabled={cargando}
              onPress={() => {
                setPaso('solicitar');
                setCodigo('');
                setCodigoDev(null);
                setMensaje('');
              }}
            />
          ) : null}
        </View>
      </View>
    </ScreenTopView>
  );
}
