import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type AppHeaderProps = {
  titulo: string;
  subtitulo?: string;
  mostrarAtras?: boolean;
};

export function AppHeader({ titulo, subtitulo, mostrarAtras = false }: AppHeaderProps) {
  return (
    <View className="gap-1">
      {mostrarAtras ? (
        <Pressable className="mb-3 h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm" onPress={() => router.back()}>
          <ChevronLeft color="#1F2A2E" size={22} />
        </Pressable>
      ) : null}
      <Text className="text-3xl font-bold text-marca-texto">{titulo}</Text>
      {subtitulo ? <Text className="text-base text-slate-600">{subtitulo}</Text> : null}
    </View>
  );
}
