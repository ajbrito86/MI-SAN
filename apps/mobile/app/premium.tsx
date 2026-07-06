import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Check, RotateCcw, Sparkles } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { ScreenScrollView } from '@/components/screen';
import { useConfiguracionMobile } from '@/hooks/use-configuracion-mobile';
import { useSuscripcion } from '@/hooks/use-suscripcion';
import { registrarError, registrarEvento } from '@/services/analytics-service';
import {
  billingNativoHabilitado,
  crearPayloadPremiumGooglePlay,
  finalizarCompraPremiumGooglePlay,
  formatearPrecioProducto,
  iniciarCompraPremiumGooglePlay,
  obtenerProductoPremiumGooglePlay,
  restaurarCompraPremiumGooglePlay,
} from '@/services/billing-service';
import { comprarPremium, restaurarCompra } from '@/services/suscripciones-service';
import { useAuthStore } from '@/stores/auth-store';

export default function PantallaPremium() {
  const queryClient = useQueryClient();
  const { data: configuracion } = useConfiguracionMobile();
  const { data: suscripcion } = useSuscripcion();
  const usuario = useAuthStore((state) => state.usuario);
  const actualizarUsuario = useAuthStore((state) => state.actualizarUsuario);
  const plataformaCompra = Platform.OS === 'ios' ? 'APP_STORE' : Platform.OS === 'android' ? 'GOOGLE_PLAY' : 'MANUAL';
  const usarBillingNativo = billingNativoHabilitado();

  const productoPremium = useMutation({
    mutationFn: obtenerProductoPremiumGooglePlay,
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

      const compraGooglePlay = await iniciarCompraPremiumGooglePlay(usuario?.id);

      if (!compraGooglePlay) {
        throw new Error('No se recibio confirmacion de compra desde Google Play.');
      }

      const suscripcionActualizada = await comprarPremium(crearPayloadPremiumGooglePlay(compraGooglePlay));
      await finalizarCompraPremiumGooglePlay(compraGooglePlay);

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
      if (!usarBillingNativo) {
        return restaurarCompra({ plataformaCompra });
      }

      const compraGooglePlay = await restaurarCompraPremiumGooglePlay();

      if (!compraGooglePlay) {
        throw new Error('No encontramos una compra Premium para restaurar en Google Play.');
      }

      const suscripcionActualizada = await restaurarCompra(crearPayloadPremiumGooglePlay(compraGooglePlay));
      await finalizarCompraPremiumGooglePlay(compraGooglePlay);

      return suscripcionActualizada;
    },
    onSuccess: () => {
      registrarEvento({ nombre: 'premium_restaurado', metadataJson: { plataformaCompra } });
      if (usuario) {
        actualizarUsuario({ ...usuario, rolGlobal: 'ORGANIZADOR' });
      }
      queryClient.invalidateQueries({ queryKey: ['suscripcion-actual'] });
      router.back();
    },
    onError: (error) => registrarError('premium_restauracion_error', error, { plataformaCompra }),
  });

  const cargando = compra.isPending || restauracion.isPending;
  const precioPremium = formatearPrecioProducto(productoPremium.data, `US$${configuracion.monetizacion.precioPremiumUsd.toFixed(2)}`);

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

        {suscripcion?.premium ? (
          <View className="rounded-lg bg-emerald-50 p-4">
            <Text className="font-semibold text-marca-verde">Tu cuenta ya tiene beneficios Premium activos.</Text>
          </View>
        ) : null}

        {!configuracion.featureFlags.premiumActivo || !configuracion.featureFlags.comprasActivas ? (
          <View className="rounded-lg bg-amber-50 p-4">
            <Text className="font-semibold text-amber-700">Premium no esta disponible temporalmente.</Text>
          </View>
        ) : null}

        {compra.error || restauracion.error ? (
          <Text className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            No pudimos completar la operacion. Intentalo nuevamente.
          </Text>
        ) : null}

        <AppButton
          titulo="Comprar Premium"
          disabled={cargando || suscripcion?.premium || !configuracion.featureFlags.premiumActivo || !configuracion.featureFlags.comprasActivas}
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
