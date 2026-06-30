import { Pressable, Text, View, type PressableProps } from 'react-native';

type AppCardProps = PressableProps & {
  titulo: string;
  detalle: string;
  estado: string;
};

export function AppCard({ titulo, detalle, estado, ...props }: AppCardProps) {
  return (
    <Pressable className="rounded-lg bg-white p-4" {...props}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-marca-texto">{titulo}</Text>
          <Text className="text-slate-600">{detalle}</Text>
        </View>
        <Text className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-marca-verde">{estado}</Text>
      </View>
    </Pressable>
  );
}
