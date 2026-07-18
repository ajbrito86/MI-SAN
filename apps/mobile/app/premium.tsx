import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Check, RotateCcw, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { useConfiguracionMobile } from '@/hooks/use-configuracion-mobile';
import { useSuscripcion } from '@/hooks/use-suscripcion';
import { registrarError, registrarEvento } from '@/services/analytics-service';
import {
  billingNativoHabilitado,
  crearPayloadPremium,
  finalizarCompraPremium,
  formatearPrecioProducto,
  iniciarCompraPremium,
  obtenerProductoPremium,
  restaurarCompraPremium,
} from '@/services/billing-service';
import { comprarPremium, restaurarCompra } from '@/services/suscripciones-service';
import { useAuthStore } from '@/stores/auth-store';

const billingLogger = globalThis.console;

export default function PantallaPremium() {
  const queryClient = useQueryClient();
  const { data: configuracion } = useConfiguracionMobile();
  const { data: suscripcion } = useSuscripcion();
  const usuario = useAuthStore((state) => state.usuario);
  const actualizarUsuario = useAuthStore((state) => state.actualizarUsuario);
  const plataformaCompra = Platform.OS === 'ios' ? 'APP_STORE' : Platform.OS === 'android' ? 'GOOGLE_PLAY' : 'MANUAL';
  const usarBillingNativo = billingNativoHabilitado();
  const [mensajeRestauracion, setMensajeRestauracion] = useState('');

  const productoPremium = useMutation({
    mutationFn: obtenerProductoPremium,
  });

  useEffect(() => {
    registrarEvento({ nombre: 'pantalla_upgrade_abierta' });
    if (usarBillingNativo) {
      productoPremium.mutate();
    }
  }, []);

  const compra = useMutation({
    mutationFn: async () => {
      if (!usarBillingNativo) {
        return comprarPremium({ plataformaCompra });
      }

      const compraNativa = await iniciarCompraPremium(usuario?.id);

      if (!compraNativa) {
        throw new Error('No se recibio confirmacion de compra desde la tienda.');
      }

      const suscripcionActualizada = await comprarPremium(crearPayloadPremium(compraNativa));
      await finalizarCompraPremium(compraNativa);

      return suscripcionActualizada;
    },
    onSuccess: () => {
      registrarEvento({ nombre: 'premium_comprado', metadataJson: { plataformaCompra } });
      if (usuario) {
        actualizarUsuario({ ...usuario, rolGlobal: 'ORGANIZADOR' });
      }
      queryClient.invalidateQueries({ queryKey: ['suscripcion-actual'] });
      router.back();
    },
    onError: (error) => registrarError('premium_compra_error', error, { plataformaCompra }),
  });

  const restauracion = useMutation({
    mutationFn: async () => {
      if (suscripcion?.plan === 'PREMIUM_SIN_ADS' && !suscripcion.esTrial) {
        return { yaActiva: true } as const;
      }
      if (!usarBillingNativo) {
        return { suscripcionActualizada: await restaurarCompra({ plataformaCompra }) } as const;
      }

      const compraNativa = await restaurarCompraPremium();

      if (!compraNativa) {
        return { noEncontrada: true } as const;
      }

      const suscripcionActualizada = await restaurarCompra(crearPayloadPremium(compraNativa));
      await finalizarCompraPremium(compraNativa);

      return { suscripcionActualizada } as const;
    },
    onSuccess: (resultado) => {
      if ('yaActiva' in resultado) {
        setMensajeRestauracion('Tu cuenta ya tiene Premium activo.');
        return;
      }
      if ('noEncontrada' in resultado) {
        setMensajeRestauracion('No encontramos compras anteriores para restaurar.');
        return;
      }
      registrarEvento({ nombre: 'premium_restaurado', metadataJson: { plataformaCompra } });
      if (usuario) {
        actualizarUsuario({ ...usuario, rolGlobal: 'ORGANIZADOR' });
      }
      queryClient.invalidateQueries({ queryKey: ['suscripcion-actual'] });
      setMensajeRestauracion('Compra restaurada correctamente.');
    },
    onError: (error) => {
      billingLogger.error('[billing:restore] error nativo completo', error);
      registrarError('premium_restauracion_error', error, { plataformaCompra });
      setMensajeRestauracion('No pudimos restaurar la compra. Intentalo nuevamente.');
    },
  });

  const cargando = compra.isPending || restauracion.isPending;
  const precioPremium = formatearPrecioProducto(productoPremium.data, `US$${configuracion.monetizacion.precioPremiumUsd.toFixed(2)}`);
  const tienePremiumPermanente = suscripcion?.plan === 'PREMIUM_SIN_ADS' && !suscripcion.esTrial;
  const tieneBeneficiosPorTrial = Boolean(suscripcion?.premium && suscripcion.esTrial);
  const errorOperacion = compra.error;

  return (
    <ScreenScrollView>
      <AppHeader titulo="Premium" subtitulo="MI-SAN sin anuncios" mostrarAtras />

      <View className="mt-5 gap-4 pb-8">
        <View className="rounded-lg bg-white p-5">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
            <Sparkles color="#168A5B" size={26} />
          </View>
          <Text className="mt-4 text-2xl font-bold text-marca-texto">{precioPremium} pago unico</Text>
          <Text className="mt-2 text-slate-600">Mantente como organizador, crea nuevos SANes y usa MI-SAN sin anuncios.</Text>
        </View>

        <View className="rounded-lg bg-white p-4">
          {['Rol organizador activo', 'Crear nuevos SANes', 'Sin banners publicitarios', 'Sin interstitials entre secciones'].map((beneficio) => (
            <View key={beneficio} className="flex-row items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
              <Check color="#168A5B" size={20} />
              <Text className="flex-1 text-slate-700">{beneficio}</Text>
            </View>
          ))}
        </View>

        {tienePremiumPermanente ? (
          <View className="rounded-lg bg-emerald-50 p-4">
            <Text className="font-semibold text-marca-verde">Tu cuenta ya tiene beneficios Premium activos.</Text>
          </View>
        ) : null}

        {tieneBeneficiosPorTrial ? (
          <View className="rounded-lg bg-emerald-50 p-4">
            <Text className="font-semibold text-marca-verde">
              Tu prueba Premium esta activa. Puedes comprar Premium permanente cuando quieras.
            </Text>
          </View>
        ) : null}

        {!configuracion.featureFlags.premiumActivo || !configuracion.featureFlags.comprasActivas ? (
          <View className="rounded-lg bg-amber-50 p-4">
            <Text className="font-semibold text-amber-700">Premium no esta disponible temporalmente.</Text>
          </View>
        ) : null}

        {errorOperacion ? (
          <Text className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {errorOperacion instanceof Error ? errorOperacion.message : 'No pudimos completar la operacion. Intentalo nuevamente.'}
          </Text>
        ) : null}
        {mensajeRestauracion ? <Text className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-marca-verde">{mensajeRestauracion}</Text> : null}

        <AppButton
          titulo="Comprar Premium"
          disabled={cargando || tienePremiumPermanente || !configuracion.featureFlags.premiumActivo || !configuracion.featureFlags.comprasActivas}
          onPress={() => {
            registrarEvento({ nombre: 'premium_compra_iniciada', metadataJson: { plataformaCompra } });
            compra.mutate();
          }}
        />
        <AppButton
          titulo="Restaurar compras"
          variante="secundario"
          disabled={cargando || !configuracion.featureFlags.premiumActivo || !configuracion.featureFlags.comprasActivas}
          onPress={() => {
            registrarEvento({ nombre: 'premium_restauracion_iniciada', metadataJson: { plataformaCompra } });
            restauracion.mutate();
          }}
        />

        <View className="flex-row items-center justify-center gap-2">
          <RotateCcw color="#64748B" size={16} />
          <Text className="text-center text-xs text-slate-500">Las compras se validaran desde el backend.</Text>
        </View>
      </View>
    </ScreenScrollView>
  );
}
