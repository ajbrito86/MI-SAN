import { LegalPage } from '@/components/legal-page';

export default function AcercaDe() {
  return (
    <LegalPage
      titulo="Acerca de"
      subtitulo="MI-SAN"
      parrafos={[
        'MI-SAN ayuda a organizar SANes desde el telefono: participantes, turnos, cuotas, pagos, historial y avisos.',
        'La primera version comercial busca validar uso real, recibir retroalimentacion y mejorar de forma continua.',
        'MI-SAN no es una entidad financiera. Es una herramienta de organizacion para grupos que ya tienen sus propios acuerdos.',
        'Soporte: support@kingdom-devs.net.',
      ]}
    />
  );
}
