import { Pressable, Text, type PressableProps } from 'react-native';

type AppButtonProps = PressableProps & {
  titulo: string;
  variante?: 'primario' | 'secundario';
  className?: string;
};

export function AppButton({ titulo, variante = 'primario', className = '', ...props }: AppButtonProps) {
  const deshabilitado = Boolean(props.disabled);
  const clases = deshabilitado
    ? 'bg-slate-200'
    : variante === 'primario'
      ? 'bg-marca-verde'
      : 'border border-marca-verde bg-white';
  const texto = deshabilitado ? 'text-slate-500' : variante === 'primario' ? 'text-white' : 'text-marca-verde';

  return (
    <Pressable className={`min-h-14 items-center justify-center rounded-lg px-5 ${clases} ${className}`} {...props}>
      <Text className={`text-base font-semibold ${texto}`}>{titulo}</Text>
    </Pressable>
  );
}
