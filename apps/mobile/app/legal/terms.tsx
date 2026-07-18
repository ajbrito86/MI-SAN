import { LegalPage } from '@/components/legal-page';

export default function TerminosCondiciones() {
  return (
    <LegalPage
      titulo="Terminos"
      subtitulo="Condiciones de uso"
      enlaceWeb="https://mi-san.kingdom-devs.net/terminos.html"
      textoEnlaceWeb="Ver términos completos en el sitio web"
      parrafos={[
        'MI-SAN es una herramienta tecnologica para facilitar la organizacion y administracion de SANes.',
        'La aplicacion no actua como entidad financiera, banco o institucion de inversion. Los usuarios son responsables de los acuerdos economicos realizados dentro de sus grupos.',
        'El usuario debe registrar informacion veraz, proteger sus credenciales y usar la aplicacion conforme a la ley aplicable.',
        'Podemos suspender cuentas que realicen abuso, fraude, uso no autorizado o acciones que afecten la seguridad del servicio.',
        'Las funciones Premium, cuando esten disponibles, eliminan anuncios segun el plan vigente y las reglas de las tiendas correspondientes.',
      ]}
    />
  );
}
