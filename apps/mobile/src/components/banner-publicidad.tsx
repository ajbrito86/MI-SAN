import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useConfiguracionMobile } from '@/hooks/use-configuracion-mobile';
import { useSuscripcion } from '@/hooks/use-suscripcion';
import { registrarError, registrarEvento } from '@/services/analytics-service';
import { adsNativosHabilitados, adsTestModeHabilitado, obtenerBannerAdUnitId } from '@/services/ads-service';

type ModuloAds = typeof import('react-native-google-mobile-ads');
type UbicacionBanner = 'dashboard' | 'historial' | 'reportes';

declare const require: (nombre: string) => ModuloAds;

const UBICACIONES_BANNER_PERMITIDAS = new Set<UbicacionBanner>(['dashboard', 'historial', 'reportes']);

export function BannerPublicidad({ ubicacion }: { ubicacion: UbicacionBanner }) {
  const { data: configuracion } = useConfiguracionMobile();
  const { data: suscripcion } = useSuscripcion();
  const adUnitId = obtenerBannerAdUnitId();
  const modoPruebaAds = adsTestModeHabilitado();
  const [moduloAds, setModuloAds] = useState<ModuloAds | null>(null);

  useEffect(() => {
    let montado = true;

    if (Platform.OS === 'web' || !adsNativosHabilitados()) {
      return undefined;
    }

    try {
      const modulo = require('react-native-google-mobile-ads');

      if (montado) {
        setModuloAds(modulo);
      }
    } catch {
      if (montado) {
        setModuloAds(null);
      }
    }

    return () => {
      montado = false;
    };
  }, []);

  const puedeMostrarBanner = modoPruebaAds || (configuracion.featureFlags.anunciosActivos && suscripcion?.mostrarAds);

  if (!UBICACIONES_BANNER_PERMITIDAS.has(ubicacion) || !puedeMostrarBanner) {
    return null;
  }

  if (adUnitId && moduloAds) {
    const { BannerAd, BannerAdSize } = moduloAds;

    return (
      <View className="items-center rounded-lg bg-white py-2">
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          onAdLoaded={() => registrarEvento({ nombre: `banner_mostrado_${ubicacion}`, tipo: 'ADS' })}
          onAdFailedToLoad={(error) => registrarError('banner_error', error, { adUnitId })}
        />
      </View>
    );
  }

  return (
    <View className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3">
      <Text className="text-center text-xs font-semibold uppercase text-slate-400">Publicidad</Text>
    </View>
  );
}
