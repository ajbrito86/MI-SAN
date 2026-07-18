import { router } from 'expo-router';
import { Check, KeyRound, Mail, Phone, User } from 'lucide-react-native';
import { useState, type ComponentProps, type ReactNode } from 'react';
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
    telefono: usuario?.telefono?.startsWith('google:') ? '' : usuario?.telefono ?? '',
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
        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <View className="gap-3">
            <CampoPerfil
              etiqueta="Nombres"
              icono={<User color="#475569" size={22} />}
              value={formulario.nombres}
              onChangeText={(valor) => actualizar('nombres', valor)}
            />
            <CampoPerfil
              etiqueta="Apellidos"
              icono={<User color="#475569" size={22} />}
              value={formulario.apellidos}
              onChangeText={(valor) => actualizar('apellidos', valor)}
            />
            {usuario?.googleId ? (
              <CampoPerfil
                etiqueta="Identificador de Google"
                icono={<KeyRound color="#64748B" size={22} />}
                value={usuario.googleId}
                editable={false}
                selectTextOnFocus={false}
                accessibilityHint="Este identificador pertenece a tu cuenta de Google y no se puede editar"
              />
            ) : null}
            <CampoPerfil
              etiqueta="Telefono"
              icono={<Phone color="#475569" size={22} />}
              keyboardType="phone-pad"
              value={formulario.telefono}
              onChangeText={(valor) => actualizar('telefono', valor)}
            />
            <CampoPerfil
              etiqueta="Correo"
              icono={<Mail color="#475569" size={22} />}
              autoCapitalize="none"
              keyboardType="email-address"
              value={formulario.email}
              onChangeText={(valor) => actualizar('email', valor)}
            />
          </View>
        </View>

        {mensaje ? (
          <View className="flex-row items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <Check color="#168A5B" size={22} />
            <Text className="flex-1 text-sm font-semibold text-marca-verde">{mensaje}</Text>
          </View>
        ) : null}
        {error ? <Text className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</Text> : null}

        <AppButton titulo={cargando ? 'Guardando...' : 'Guardar cambios'} disabled={cargando} onPress={guardar} />
        {cargando ? <ActivityIndicator color="#168A5B" /> : null}
      </View>
    </ScreenScrollView>
  );
}

function CampoPerfil({
  etiqueta,
  icono,
  ...props
}: ComponentProps<typeof TextInput> & {
  etiqueta: string;
  icono: ReactNode;
}) {
  return (
    <View className="min-h-20 flex-row items-center gap-4 rounded-xl border border-slate-200 bg-white px-4">
      {icono}
      <View className="min-w-0 flex-1">
        <Text className="text-xs font-semibold text-slate-500">{etiqueta}</Text>
        <TextInput className="mt-1 min-h-12 min-w-0 py-2 text-base leading-6 text-marca-texto" placeholderTextColor="#94A3B8" {...props} />
      </View>
    </View>
  );
}
