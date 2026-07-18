import * as WebBrowser from 'expo-web-browser';
import { Alert, Text, View } from 'react-native';
import { AppButton } from './app-button';
import { AppHeader } from './app-header';
import { ScreenScrollView } from './screen';

type LegalPageProps = {
  titulo: string;
  subtitulo: string;
  parrafos: string[];
  enlaceWeb?: string;
  textoEnlaceWeb?: string;
};

export function LegalPage({ titulo, subtitulo, parrafos, enlaceWeb, textoEnlaceWeb = 'Ver contenido completo en el sitio web' }: LegalPageProps) {
  async function abrirEnlaceWeb() {
    if (!enlaceWeb) {
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(enlaceWeb, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: '#168A5B',
        toolbarColor: '#F5FBF7',
      });
    } catch {
      Alert.alert('No pudimos abrir el sitio web', 'Verifica tu conexión e inténtalo nuevamente.');
    }
  }

  return (
    <ScreenScrollView>
      <AppHeader titulo={titulo} subtitulo={subtitulo} mostrarAtras />
      <View className="mt-5 rounded-lg bg-white p-4">
        <Text className="text-sm font-semibold text-slate-500">Ultima actualizacion: 2 de julio de 2026</Text>
        <View className="mt-4 gap-3">
          {parrafos.map((parrafo) => (
            <Text key={parrafo} className="text-base leading-6 text-slate-700">
              {parrafo}
            </Text>
          ))}
        </View>
      </View>
      {enlaceWeb ? (
        <View className="mt-4 pb-8">
          <AppButton titulo={textoEnlaceWeb} variante="secundario" onPress={abrirEnlaceWeb} accessibilityHint="Abre el navegador web" />
        </View>
      ) : null}
    </ScreenScrollView>
  );
}
