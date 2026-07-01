import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { registrar } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Registro() {
  const guardarSesion = useAuthStore((state) => state.guardarSesion);
  const [formulario, setFormulario] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    email: '',
    contrasena: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function actualizar(campo: keyof typeof formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function enviar() {
    setError('');
    const payload = {
      nombres: formulario.nombres.trim(),
      apellidos: formulario.apellidos.trim(),
      telefono: formulario.telefono.trim(),
      email: formulario.email.trim().toLowerCase(),
      contrasena: formulario.contrasena,
    };

    if (!payload.nombres || !payload.apellidos || !payload.telefono || !payload.email || !payload.contrasena) {
      setError('Completa todos los campos para crear tu cuenta.');
      return;
    }

    if (!payload.email.includes('@') || !payload.email.includes('.')) {
      setError('Escribe un correo valido.');
      return;
    }

    if (payload.contrasena.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await registrar(payload);
      guardarSesion(respuesta);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear tu cuenta.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-marca-fondo px-5">
      <View className="flex-1 justify-center gap-5">
        <Text className="text-3xl font-bold text-marca-texto">Crear cuenta</Text>
        <View className="gap-3">
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Nombres" value={formulario.nombres} onChangeText={(valor) => actualizar('nombres', valor)} />
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Apellidos" value={formulario.apellidos} onChangeText={(valor) => actualizar('apellidos', valor)} />
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Telefono" keyboardType="phone-pad" value={formulario.telefono} onChangeText={(valor) => actualizar('telefono', valor)} />
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Correo" autoCapitalize="none" keyboardType="email-address" value={formulario.email} onChangeText={(valor) => actualizar('email', valor)} />
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Contrasena" secureTextEntry value={formulario.contrasena} onChangeText={(valor) => actualizar('contrasena', valor)} />
          {error ? <Text className="text-sm font-semibold text-red-600">{error}</Text> : null}
          <AppButton titulo={cargando ? 'Creando...' : 'Crear cuenta'} disabled={cargando} onPress={enviar} />
          {cargando ? <ActivityIndicator color="#168A5B" /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
