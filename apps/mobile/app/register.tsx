import { router } from 'expo-router';
import { ChevronLeft, Lock, Mail, Phone, User } from 'lucide-react-native';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/app-button';
import { useKeyboardBottomPadding } from '@/components/screen';
import { registrar } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

const logoMiSan = require('../assets/Logo-mi-san.png');

export default function Registro() {
  const insets = useSafeAreaInsets();
  const keyboardBottomPadding = useKeyboardBottomPadding(48);
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
    <KeyboardAvoidingView className="flex-1 bg-[#F6FCF8]" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-emerald-100 opacity-50" />
      <View className="absolute -right-24 top-4 h-72 w-72 rounded-full bg-white opacity-90" />
      <TouchableOpacity
        activeOpacity={0.82}
        className="absolute left-5 z-10 h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"
        style={{ top: insets.top + 16 }}
        onPress={() => router.back()}
      >
        <ChevronLeft color="#17231F" size={23} />
      </TouchableOpacity>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          gap: 20,
          paddingTop: insets.top + 72,
          paddingRight: 20,
          paddingBottom: Math.max(insets.bottom + 32, 48) + keyboardBottomPadding,
          paddingLeft: 20,
        }}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center">
          <Image source={logoMiSan} className="h-28 w-28" resizeMode="contain" />
        </View>
        <View className="rounded-[28px] bg-white/95 p-5 shadow-sm">
          <Text className="text-center text-3xl font-extrabold text-marca-texto">Crear cuenta</Text>
          <Text className="mt-2 text-center text-base text-slate-500">Registra tus datos principales</Text>
          <View className="mt-5 gap-3">
            <CampoRegistro icono={<User size={20} color="#667085" />} placeholder="Nombres" value={formulario.nombres} onChangeText={(valor) => actualizar('nombres', valor)} />
            <CampoRegistro icono={<User size={20} color="#667085" />} placeholder="Apellidos" value={formulario.apellidos} onChangeText={(valor) => actualizar('apellidos', valor)} />
            <CampoRegistro icono={<Phone size={20} color="#667085" />} placeholder="Telefono" keyboardType="phone-pad" value={formulario.telefono} onChangeText={(valor) => actualizar('telefono', valor)} />
            <CampoRegistro icono={<Mail size={20} color="#667085" />} placeholder="Correo" autoCapitalize="none" keyboardType="email-address" value={formulario.email} onChangeText={(valor) => actualizar('email', valor)} />
            <CampoRegistro icono={<Lock size={20} color="#667085" />} placeholder="Contrasena" secureTextEntry value={formulario.contrasena} onChangeText={(valor) => actualizar('contrasena', valor)} />
            {error ? <Text className="text-sm font-semibold text-red-600">{error}</Text> : null}
            <AppButton titulo={cargando ? 'Creando...' : 'Crear cuenta'} disabled={cargando} onPress={enviar} />
            {cargando ? <ActivityIndicator color="#168A5B" /> : null}
            <Text className="text-center text-sm text-slate-500">
              Ya tienes una cuenta?{' '}
              <Text className="font-bold text-marca-verde" onPress={() => router.back()}>
                Inicia sesion
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CampoRegistro({
  icono,
  ...props
}: ComponentProps<typeof TextInput> & {
  icono: ReactNode;
}) {
  return (
    <View className="min-h-14 flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
      {icono}
      <TextInput className="min-h-12 min-w-0 flex-1 text-base text-marca-texto" placeholderTextColor="#667085" {...props} />
    </View>
  );
}
