import * as Google from 'expo-auth-session/providers/google';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Bell, Check, Eye, EyeOff, FileText, Lock, Mail, ShieldCheck, Users } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { ScreenTopView } from '@/components/screen';
import { login, loginConGoogle } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

const logoMiSan = require('../assets/Logo-mi-san.png');
const logoGoogle = require('../assets/Google-G-Icon.png');
const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '107458796974-162ttfmbucdog5s8b47pq6ac25ctn0rh.apps.googleusercontent.com';
const googleAndroidClientId =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '107458796974-sf1vc8erhk0l877234j7hm8brddfsj2v.apps.googleusercontent.com';
const googleClientIdSufijo = '.apps.googleusercontent.com';

WebBrowser.maybeCompleteAuthSession();

function obtenerGoogleRedirectUriAndroid() {
  if (Platform.OS !== 'android') {
    return undefined;
  }

  return `com.googleusercontent.apps.${googleAndroidClientId.replace(googleClientIdSufijo, '')}:/oauthredirect`;
}

export default function Login() {
  const guardarSesion = useAuthStore((state) => state.guardarSesion);
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [requestGoogle, respuestaGoogle, abrirGoogle] = Google.useIdTokenAuthRequest(
    {
      webClientId: googleWebClientId,
      androidClientId: googleAndroidClientId,
      redirectUri: obtenerGoogleRedirectUriAndroid(),
      selectAccount: true,
    },
    {
      native: obtenerGoogleRedirectUriAndroid(),
    }
  );

  async function autenticarConGoogle(idToken: string) {
    setCargandoGoogle(true);

    try {
      const respuesta = await loginConGoogle({ idToken });
      guardarSesion(respuesta);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesion con Google.');
    } finally {
      setCargandoGoogle(false);
    }
  }

  useEffect(() => {
    if (!respuestaGoogle) {
      return;
    }

    console.info('[GoogleSignIn] respuesta', respuestaGoogle.type, respuestaGoogle.type === 'success' ? Object.keys(respuestaGoogle.params) : null);

    if (respuestaGoogle.type === 'success') {
      const idToken = respuestaGoogle.params.id_token;

      if (idToken) {
        autenticarConGoogle(idToken);
      } else {
        setError('Google no devolvio un token valido.');
        setCargandoGoogle(false);
      }
      return;
    }

    if (respuestaGoogle.type === 'error') {
      setError('No pudimos iniciar sesion con Google.');
      setCargandoGoogle(false);
    }
  }, [respuestaGoogle]);

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

  async function enviarGoogle() {
    setError('');

    if (!requestGoogle) {
      setError('Google Sign-In no esta listo. Revisa la configuracion.');
      return;
    }

    setCargandoGoogle(true);

    try {
      const resultado = await abrirGoogle();
      console.info('[GoogleSignIn] resultado prompt', resultado.type, resultado.type === 'success' ? Object.keys(resultado.params) : null);

      if (resultado.type === 'success') {
        const idToken = resultado.params.id_token;

        if (idToken) {
          await autenticarConGoogle(idToken);
          return;
        }
      }

      if (resultado.type === 'cancel' || resultado.type === 'dismiss') {
        setCargandoGoogle(false);
      }
    } catch {
      setCargandoGoogle(false);
      setError('No pudimos abrir Google Sign-In.');
    }
  }

  return (
    <ScreenTopView className="flex-1 bg-[#F4FAF5]">
      <View className="absolute -left-16 top-16 h-56 w-56 rounded-full bg-emerald-100 opacity-60" />
      <View className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-white opacity-80" />
      <View className="absolute left-8 top-40 h-24 w-24 rounded-full bg-emerald-50 opacity-70" />

      <ScrollView
        className="-mx-5 flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center pt-5">
          <View className="h-28 w-28 overflow-hidden rounded-full border-8 border-white bg-white shadow-sm">
            <Image source={logoMiSan} className="h-full w-full" resizeMode="cover" />
          </View>
          <Text className="mt-3 text-5xl font-extrabold text-[#075A37]">Mi-San</Text>
          <Text className="mt-2 max-w-xs text-center text-base leading-6 text-slate-700">
            Administra tu sociedad con claridad: turnos, cuotas, comprobantes y recordatorios en un solo lugar.
          </Text>
        </View>

        <View className="mt-7 rounded-[32px] bg-white/95 p-5 shadow-sm">
          <Text className="text-2xl font-bold text-[#075A37]">Iniciar sesion</Text>

          <View className="mt-4 gap-3">
            <View className="flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <Mail size={21} color="#475569" />
              <TextInput
                className="min-h-8 flex-1 text-base text-marca-texto"
                placeholder="Correo electronico"
                placeholderTextColor="#8A97A8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={identificador}
                onChangeText={setIdentificador}
              />
            </View>

            <View className="flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <Lock size={21} color="#475569" />
              <TextInput
                className="min-h-8 flex-1 text-base text-marca-texto"
                placeholder="Contrasena"
                placeholderTextColor="#8A97A8"
                secureTextEntry={!mostrarContrasena}
                value={contrasena}
                onChangeText={setContrasena}
              />
              <Pressable onPress={() => setMostrarContrasena((valor) => !valor)} hitSlop={8}>
                {mostrarContrasena ? <EyeOff size={21} color="#17231F" /> : <Eye size={21} color="#17231F" />}
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between gap-3">
              <Pressable className="flex-row items-center gap-2" onPress={() => setRecordarme((valor) => !valor)}>
                <View
                  className={`h-6 w-6 items-center justify-center rounded border ${
                    recordarme ? 'border-marca-verde bg-marca-verde' : 'border-slate-300 bg-white'
                  }`}
                >
                  {recordarme ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
                </View>
                <Text className="text-sm text-marca-texto">Recordarme</Text>
              </Pressable>

              <Link href="/forgot-password" className="text-sm font-semibold text-marca-verde">
                Olvidaste tu contrasena?
              </Link>
            </View>

            {error ? <Text className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</Text> : null}

            <AppButton titulo={cargando ? 'Iniciando...' : 'Iniciar sesion'} disabled={cargando || cargandoGoogle} onPress={enviar} />
            {cargando ? <ActivityIndicator color="#168A5B" /> : null}

            <View className="flex-row items-center gap-3 py-1">
              <View className="h-px flex-1 bg-slate-200" />
              <Text className="text-sm text-slate-600">o continua con</Text>
              <View className="h-px flex-1 bg-slate-200" />
            </View>

            <Pressable
              className={`h-14 flex-row items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white ${
                cargando || cargandoGoogle ? 'opacity-70' : ''
              }`}
              disabled={cargando || cargandoGoogle}
              onPress={enviarGoogle}
            >
              {cargandoGoogle ? (
                <ActivityIndicator color="#168A5B" />
              ) : (
                <Image source={logoGoogle} className="h-5 w-5" resizeMode="contain" />
              )}
              <Text className="text-base font-semibold text-marca-texto">
                {cargandoGoogle ? 'Conectando...' : 'Continuar con Google'}
              </Text>
            </Pressable>

            <View className="mt-1 flex-row justify-center gap-1">
              <Text className="text-base text-marca-texto">No tienes cuenta?</Text>
              <Link href="/register" className="text-base font-bold text-marca-verde">
                Crear cuenta
              </Link>
            </View>
          </View>
        </View>

        <View className="mt-5 rounded-2xl bg-white/80 p-4 shadow-sm">
          <View className="flex-row justify-between gap-2">
            <Beneficio icono={<Users size={28} color="#168A5B" />} titulo="Organiza" detalle="turnos y tareas" />
            <Beneficio icono={<FileText size={28} color="#168A5B" />} titulo="Gestiona" detalle="cuotas y pagos" />
            <Beneficio icono={<Bell size={28} color="#168A5B" />} titulo="Recibe" detalle="recordatorios" />
          </View>
        </View>

        <View className="mt-5 flex-row items-center justify-center gap-2">
          <ShieldCheck size={17} color="#64748B" />
          <Text className="text-sm text-slate-500">Tus datos estan protegidos</Text>
        </View>
      </ScrollView>
    </ScreenTopView>
  );
}

function Beneficio({ icono, titulo, detalle }: { icono: ReactNode; titulo: string; detalle: string }) {
  return (
    <View className="min-w-0 flex-1 items-center gap-1">
      {icono}
      <Text className="text-center text-sm font-bold text-marca-texto">{titulo}</Text>
      <Text className="text-center text-[11px] text-slate-600">{detalle}</Text>
    </View>
  );
}
