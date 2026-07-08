import { router } from 'expo-router';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { eliminarCuenta } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

export default function EliminarCuenta() {
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion);
  const usuario = useAuthStore((state) => state.usuario);
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const esCuentaGoogle = usuario?.telefono?.startsWith('google:') ?? false;
  const puedeEliminar = (esCuentaGoogle || contrasena.length >= 8) && confirmacion.trim().toUpperCase() === 'ELIMINAR';

  async function confirmarEliminacion() {
    setError('');

    if (!puedeEliminar) {
      setError(esCuentaGoogle ? 'Escribe la palabra ELIMINAR para continuar.' : 'Escribe tu contrasena y la palabra ELIMINAR para continuar.');
      return;
    }

    setCargando(true);

    try {
      await eliminarCuenta(esCuentaGoogle ? '' : contrasena);
      cerrarSesion();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos eliminar tu cuenta.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled">
      <AppHeader titulo="Eliminar cuenta" subtitulo="Confirmacion requerida" mostrarAtras />

      <View className="mt-5 gap-4 pb-8">
        <View className="rounded-lg bg-red-50 p-4">
          <View className="flex-row items-start gap-3">
            <AlertTriangle color="#B91C1C" size={24} />
            <View className="flex-1">
              <Text className="font-semibold text-red-700">Esta accion desactiva tu cuenta.</Text>
              <Text className="mt-1 text-sm leading-5 text-red-700">
                Eliminaremos tus datos personales visibles y cerraremos tu sesion. Los registros operativos necesarios pueden conservarse de forma
                anonimizada.
              </Text>
            </View>
          </View>
        </View>

        <View className="rounded-lg bg-white p-4">
          {esCuentaGoogle ? (
            <Text className="text-sm leading-5 text-slate-600">Tu cuenta usa inicio de sesion con Google. Para eliminarla, confirma escribiendo ELIMINAR.</Text>
          ) : (
            <>
              <Text className="text-sm font-semibold text-marca-texto">Contrasena actual</Text>
              <View className="mt-2 flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <TextInput
                  className="min-h-8 min-w-0 flex-1 text-base text-marca-texto"
                  placeholder="Escribe tu contrasena"
                  placeholderTextColor="#8A97A8"
                  secureTextEntry={!mostrarContrasena}
                  value={contrasena}
                  onChangeText={setContrasena}
                />
                <Pressable onPress={() => setMostrarContrasena((valor) => !valor)} hitSlop={8}>
                  {mostrarContrasena ? <EyeOff size={21} color="#17231F" /> : <Eye size={21} color="#17231F" />}
                </Pressable>
              </View>
            </>
          )}

          <Text className="mt-4 text-sm font-semibold text-marca-texto">Confirmacion</Text>
          <TextInput
            className="mt-2 rounded-lg border border-slate-200 bg-white px-4 py-4 text-base text-marca-texto"
            placeholder="Escribe ELIMINAR"
            placeholderTextColor="#8A97A8"
            autoCapitalize="characters"
            value={confirmacion}
            onChangeText={setConfirmacion}
          />
        </View>

        {error ? <Text className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</Text> : null}

        <AppButton titulo={cargando ? 'Eliminando...' : 'Eliminar mi cuenta'} disabled={cargando || !puedeEliminar} onPress={confirmarEliminacion} />
        {cargando ? <ActivityIndicator color="#168A5B" /> : null}
        <AppButton titulo="Cancelar" variante="secundario" disabled={cargando} onPress={() => router.back()} />
      </View>
    </ScreenScrollView>
  );
}
