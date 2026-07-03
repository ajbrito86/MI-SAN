import { LegalPage } from '@/components/legal-page';

export default function PoliticaPrivacidad() {
  return (
    <LegalPage
      titulo="Privacidad"
      subtitulo="Uso y proteccion de datos"
      parrafos={[
        'MI-SAN recopila datos necesarios para crear y administrar cuentas, SANes, participantes, pagos, configuraciones y soporte.',
        'Los datos pueden incluir nombre, correo electronico, telefono, foto de perfil opcional, informacion de uso, version de la aplicacion, identificadores tecnicos y diagnosticos.',
        'Usamos esta informacion para operar la aplicacion, proteger cuentas, mejorar el servicio, enviar avisos funcionales y cumplir requisitos legales.',
        'MI-SAN no vende datos personales. Podemos compartir datos con proveedores de infraestructura, servicios de analitica, Google AdMob cuando aplique publicidad, y autoridades competentes cuando la ley lo requiera.',
        'Puedes eliminar tu cuenta desde la aplicacion o solicitar ayuda en soporte@mi-san.app.',
      ]}
    />
  );
}
