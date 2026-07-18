import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { mostrarOpcionesPrivacidadAds } from '@/services/ads-service';

export default function PrivacidadAnuncios() {
  const [mensaje, setMensaje] = useState('');
  const [gestionando, setGestionando] = useState(false);

  async function gestionar() {
    setGestionando(true);
    setMensaje('Consultando las opciones disponibles para tu dispositivo y región...');

    try {
      const resultado = await mostrarOpcionesPrivacidadAds();

      if (resultado.estado === 'NO_DISPONIBLE') {
        setMensaje('Las preferencias de anuncios no están disponibles en este entorno. En Expo Go o cuando los anuncios nativos están desactivados, Google no puede abrir su formulario. Puedes probarlo en una compilación nativa de MI-SAN.');
      } else if (resultado.estado === 'NO_REQUERIDO') {
        setMensaje('Google no requiere opciones adicionales de privacidad para este dispositivo o región en este momento. No necesitas realizar ninguna acción.');
      } else {
        setMensaje('Preferencias revisadas. Google aplicará las opciones seleccionadas cuando corresponda.');
      }
    } catch {
      setMensaje('No pudimos consultar las preferencias de anuncios. Verifica tu conexión e inténtalo nuevamente.');
    } finally {
      setGestionando(false);
    }
  }

  return (
    <ScreenScrollView>
      <AppHeader titulo="Privacidad de anuncios" subtitulo="Publicidad y consentimiento" mostrarAtras />
      <View className="mt-5 gap-4 pb-8">
        <View className="gap-3 rounded-2xl bg-white p-5">
          <Text className="text-base leading-6 text-slate-700">MI-SAN utiliza Google AdMob para mostrar anuncios. Los usuarios Premium no reciben anuncios.</Text>
          <Text className="text-base leading-6 text-slate-700">Los anuncios pueden ser personalizados o no personalizados según tu consentimiento, permisos del dispositivo, región y configuración de Google.</Text>
          <Text className="text-base leading-6 text-slate-700">MI-SAN no vende directamente tu información personal. Cuando Google exige opciones de privacidad en tu región, puedes revisarlas desde esta pantalla.</Text>
        </View>
        {mensaje ? (
          <View className="rounded-xl border border-emerald-100 bg-emerald-50 p-4" accessibilityLiveRegion="polite">
            <Text className="text-sm font-semibold leading-5 text-slate-700">{mensaje}</Text>
          </View>
        ) : null}
        <AppButton
          titulo={gestionando ? 'Consultando preferencias...' : 'Gestionar preferencias de anuncios'}
          onPress={gestionar}
          disabled={gestionando}
        />
        <AppButton titulo="Política de privacidad" variante="secundario" onPress={() => router.push('/legal/privacy' as never)} />
      </View>
    </ScreenScrollView>
  );
}
