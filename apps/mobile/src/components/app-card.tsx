import { Pressable, Text, View, type PressableProps } from 'react-native';
import { etiquetaEstadoOperativo } from '@/lib/estados';

type AppCardProps = PressableProps & {
  titulo: string;
  detalle: string;
  estado: string;
};

export function AppCard({ titulo, detalle, estado, ...props }: AppCardProps) {
  const estadoEstilo = estilosEstado(estado);

  return (
    <Pressable className="rounded-2xl bg-white p-5 shadow-sm" {...props}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-marca-texto">{titulo}</Text>
          <Text className="text-slate-600">{detalle}</Text>
        </View>
        <Text className={`rounded-full px-3 py-1 text-xs font-bold ${estadoEstilo}`}>{etiquetaEstadoOperativo(estado)}</Text>
      </View>
    </Pressable>
  );
}

function estilosEstado(estado: string) {
  if (['AL DIA', 'CONFIRMADO', 'ACTIVA', 'ENTREGADO'].includes(estado)) {
    return 'bg-emerald-50 text-marca-verde';
  }

  if (['PENDIENTE', 'PROGRAMADO'].includes(estado)) {
    return 'bg-amber-50 text-amber-700';
  }

  if (['ATRASADO', 'RECHAZADO', 'INCUMPLIDO', 'CANCELADO', 'CERRADO'].includes(estado)) {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-slate-100 text-slate-600';
}
