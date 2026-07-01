import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { ScreenTopView } from '@/components/screen';
import { login } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

export default function Login() {
  const guardarSesion = useAuthStore((state) => state.guardarSesion);
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    setError('');
    const identificadorLimpio = identificador.trim();

    if (!identificadorLimpio || !contrasena) {
      setError('Escribe tu telefono o correo y tu contrasena.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await login({ identificador: identificadorLimpio, contrasena });
      guardarSesion(respuesta);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesion.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScreenTopView className="flex-1 bg-marca-fondo">
      <View className="flex-1 justify-center gap-5">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-marca-texto">Bienvenido</Text>
          <Text className="text-base text-slate-600">Entra con tu telefono o correo.</Text>
        </View>

        <View className="gap-3">
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Telefono o correo" autoCapitalize="none" value={identificador} onChangeText={setIdentificador} />
          <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-base" placeholder="Contrasena" secureTextEntry value={contrasena} onChangeText={setContrasena} />
          {error ? <Text className="text-sm font-semibold text-red-600">{error}</Text> : null}
          <AppButton titulo={cargando ? 'Entrando...' : 'Entrar'} disabled={cargando} onPress={enviar} />
          {cargando ? <ActivityIndicator color="#168A5B" /> : null}
        </View>

        <View className="flex-row justify-between">
          <Link href="/forgot-password" className="text-marca-azul">Recuperar contrasena</Link>
          <Link href="/register" className="font-semibold text-marca-verde">Registrarme</Link>
        </View>
      </View>
    </ScreenTopView>
  );
}
