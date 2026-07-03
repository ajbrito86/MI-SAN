import { Text, View } from 'react-native';
import { AppHeader } from './app-header';
import { ScreenScrollView } from './screen';

type LegalPageProps = {
  titulo: string;
  subtitulo: string;
  parrafos: string[];
};

export function LegalPage({ titulo, subtitulo, parrafos }: LegalPageProps) {
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
    </ScreenScrollView>
  );
}
