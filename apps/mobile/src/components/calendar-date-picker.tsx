import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type CalendarDatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function CalendarDatePicker({ label, value, onChange }: CalendarDatePickerProps) {
  const fechaBase = value ? crearFechaLocal(value) : new Date();
  const year = fechaBase.getFullYear();
  const month = fechaBase.getMonth();
  const celdas = crearCeldasMes(year, month);

  const cambiarMes = (delta: number) => {
    const siguiente = new Date(year, month + delta, 1);
    onChange(formatearFecha(siguiente));
  };

  return (
    <View className="gap-2">
      <Text className="font-semibold text-marca-texto">{label}</Text>
      <View className="rounded-lg bg-white p-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100" onPress={() => cambiarMes(-1)}>
            <ChevronLeft color="#1F2A2E" size={20} />
          </Pressable>
          <Text className="text-base font-bold text-marca-texto">
            {MESES[month]} {year}
          </Text>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100" onPress={() => cambiarMes(1)}>
            <ChevronRight color="#1F2A2E" size={20} />
          </Pressable>
        </View>

        <View className="flex-row">
          {DIAS.map((dia, index) => (
            <Text key={`${dia}-${index}`} className="w-[14.285%] text-center text-xs font-bold text-slate-500">
              {dia}
            </Text>
          ))}
        </View>

        <View className="mt-2 flex-row flex-wrap">
          {celdas.map((fecha, index) => {
            const fechaTexto = fecha ? formatearFecha(fecha) : '';
            const seleccionado = fechaTexto === value;
            return (
              <Pressable
                key={`${fechaTexto}-${index}`}
                className="aspect-square w-[14.285%] items-center justify-center p-1"
                disabled={!fecha}
                onPress={() => fecha && onChange(formatearFecha(fecha))}
              >
                {fecha ? (
                  <View className={`h-9 w-9 items-center justify-center rounded-full ${seleccionado ? 'bg-marca-verde' : 'bg-white'}`}>
                    <Text className={`text-sm font-semibold ${seleccionado ? 'text-white' : 'text-marca-texto'}`}>{fecha.getDate()}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function crearCeldasMes(year: number, month: number) {
  const primerDia = new Date(year, month, 1).getDay();
  const diasDelMes = new Date(year, month + 1, 0).getDate();
  const celdas: Array<Date | null> = Array.from({ length: primerDia }, () => null);

  for (let dia = 1; dia <= diasDelMes; dia += 1) {
    celdas.push(new Date(year, month, dia));
  }

  while (celdas.length % 7 !== 0) {
    celdas.push(null);
  }

  return celdas;
}

function crearFechaLocal(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatearFecha(fecha: Date) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
