import { StyleSheet, Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

type AppButtonProps = TouchableOpacityProps & {
  titulo: string;
  variante?: 'primario' | 'secundario';
  className?: string;
};

export function AppButton({ titulo, variante = 'primario', className = '', ...props }: AppButtonProps) {
  const deshabilitado = Boolean(props.disabled);
  const estiloBoton = [
    estilos.boton,
    variante === 'primario' ? estilos.primario : estilos.secundario,
    deshabilitado ? estilos.deshabilitado : null,
    className.includes('min-h-20') ? estilos.alto : null,
  ];
  const estiloTexto = [estilos.texto, deshabilitado ? estilos.textoDeshabilitado : variante === 'primario' ? estilos.textoPrimario : estilos.textoSecundario];

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={estiloBoton}
      {...props}
    >
      <Text style={estiloTexto}>{titulo}</Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  alto: {
    minHeight: 80,
  },
  primario: {
    backgroundColor: '#07985E',
  },
  secundario: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  deshabilitado: {
    backgroundColor: '#E2E8F0',
    borderColor: '#E2E8F0',
  },
  texto: {
    fontSize: 16,
    fontWeight: '600',
  },
  textoPrimario: {
    color: '#FFFFFF',
  },
  textoSecundario: {
    color: '#078955',
  },
  textoDeshabilitado: {
    color: '#64748B',
  },
});
