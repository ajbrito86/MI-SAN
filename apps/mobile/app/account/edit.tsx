import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { actualizarPerfil } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

export default function EditarPerfil() {
  const usuario = useAuthStore((state) => state.usuario);
  const actualizarUsuario = useAuthStore((state) => state.actualizarUsuario);
  const [formulario, setFormulario] = useState({
    nombres: usuario?.nombres ?? '',
    apellidos: usuario?.apellidos ?? '',
    telefono: usuario?.telefono ?? '',
    email: usuario?.email ?? '',
  });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  function actualizar(campo: keyof typeof formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar() {
    setError('');
    setMensaje('');

    const payload = {
      nombres: formulario.nombres.trim(),
      apellidos: formulario.apellidos.trim(),
      telefono: formulario.telefono.trim(),
      email: formulario.email.trim().toLowerCase(),
    };

    if (!payload.nombres || !payload.apellidos || !payload.telefono || !payload.email) {
      setError('Completa todos los datos para actualizar tu perfil.');
      return;
    }

    if (!payload.email.includes('@') || !payload.email.includes('.')) {
      setError('Escribe un correo valido.');
      return;
    }

    setCargando(true);

    try {
      const usuarioActualizado = await actualizarPerfil(payload);
      actualizarUsuario({
        ...usuarioActualizado,
        suscripcion: usuario?.suscripcion,
      });
      setMensaje('Perfil actualizado correctamente.');
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos actualizar tu perfil.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled">
      <AppHeader titulo="Editar perfil" subtitulo="Actualiza tus datos principales" mostrarAtras />

      <View className="mt-5 gap-4 pb-8">
        <View className="rounded-lg bg-white p-4">
          <View className="gap-3">
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base"
              placeholder="Nombres"
              value={formulario.nombres}
              onChangeText={(valor) => actualizar('nombres', valor)}
            />
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base"
              placeholder="Apellidos"
              value={formulario.apellidos}
              onChangeText={(valor) => actualizar('apellidos', valor)}
            />
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base"
              placeholder="Telefono"
              keyboardType="phone-pad"
              value={formulario.telefono}
              onChangeText={(valor) => actualizar('telefono', valor)}
            />
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base"
              placeholder="Correo"
              autoCapitalize="none"
              keyboardType="email-address"
              value={formulario.email}
              onChangeText={(valor) => actualizar('email', valor)}
            />
          </View>
        </View>

        {mensaje ? <Text className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-marca-verde">{mensaje}</Text> : null}
        {error ? <Text className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</Text> : null}

        <AppButton titulo={cargando ? 'Guardando...' : 'Guardar cambios'} disabled={cargando} onPress={guardar} />
        {cargando ? <ActivityIndicator color="#168A5B" /> : null}
      </View>
    </ScreenScrollView>
  );
}
