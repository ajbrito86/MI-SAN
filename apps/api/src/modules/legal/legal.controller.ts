import { Controller, Get, Header } from '@nestjs/common';

const soporte = 'soporte@mi-san.app';

@Controller('legal')
export class LegalController {
  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  politicaPrivacidad() {
    return paginaLegal(
      'Politica de Privacidad',
      `
        <p>MI-SAN recopila datos necesarios para crear y administrar cuentas, SANes, participantes, pagos, configuraciones y soporte.</p>
        <p>Los datos pueden incluir nombre, correo electronico, telefono, foto de perfil opcional, informacion de uso, version de la aplicacion, identificadores tecnicos y diagnosticos.</p>
        <p>Usamos esta informacion para operar la aplicacion, proteger cuentas, mejorar el servicio, enviar avisos funcionales y cumplir requisitos legales.</p>
        <p>MI-SAN no vende datos personales. Podemos compartir datos con proveedores de infraestructura, servicios de analitica, Google AdMob cuando aplique publicidad, y autoridades competentes cuando la ley lo requiera.</p>
        <p>Los datos se transmiten mediante conexiones seguras. El usuario puede solicitar o ejecutar la eliminacion de cuenta desde la aplicacion.</p>
        <p>Contacto: <a href="mailto:${soporte}">${soporte}</a>.</p>
      `,
    );
  }

  @Get('terms')
  @Header('Content-Type', 'text/html; charset=utf-8')
  terminos() {
    return paginaLegal(
      'Terminos y Condiciones',
      `
        <p>MI-SAN es una herramienta tecnologica para facilitar la organizacion y administracion de SANes.</p>
        <p>La aplicacion no actua como entidad financiera, banco o institucion de inversion. Los usuarios son responsables de los acuerdos economicos realizados dentro de sus grupos.</p>
        <p>El usuario debe registrar informacion veraz, proteger sus credenciales y usar la aplicacion conforme a la ley aplicable.</p>
        <p>Podemos suspender cuentas que realicen abuso, fraude, uso no autorizado o acciones que afecten la seguridad del servicio.</p>
        <p>Las funciones Premium, cuando esten disponibles, eliminan anuncios segun el plan vigente y las reglas de las tiendas correspondientes.</p>
        <p>Contacto: <a href="mailto:${soporte}">${soporte}</a>.</p>
      `,
    );
  }

  @Get('account-deletion')
  @Header('Content-Type', 'text/html; charset=utf-8')
  eliminacionCuenta() {
    return paginaLegal(
      'Eliminacion de Cuenta',
      `
        <p>Los usuarios pueden iniciar la eliminacion desde la aplicacion en Perfil, Cuenta, Eliminar cuenta.</p>
        <p>Para proteger la cuenta, MI-SAN solicita la contrasena actual y una confirmacion explicita antes de ejecutar la eliminacion.</p>
        <p>Al eliminar una cuenta se desactivan las credenciales, se remueven datos personales visibles y se cancela la suscripcion activa.</p>
        <p>Podemos conservar registros operativos anonimizados, auditoria basica o informacion necesaria para seguridad, cumplimiento legal y consistencia historica de grupos.</p>
        <p>Si necesitas ayuda, escribe a <a href="mailto:${soporte}">${soporte}</a>.</p>
      `,
    );
  }

  @Get('support')
  @Header('Content-Type', 'text/html; charset=utf-8')
  soporte() {
    return paginaLegal(
      'Soporte',
      `
        <p>Correo oficial de soporte: <a href="mailto:${soporte}">${soporte}</a>.</p>
        <p>Tiempo estimado de respuesta: 2 a 5 dias laborables durante la primera etapa comercial.</p>
        <p>Incluye en tu mensaje el correo de tu cuenta, una descripcion clara del problema y capturas si ayudan a entender el caso.</p>
      `,
    );
  }
}

function paginaLegal(titulo: string, contenido: string) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${titulo} - MI-SAN</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f4faf5; color: #17231f; line-height: 1.6; }
      main { max-width: 760px; margin: 0 auto; padding: 32px 20px; }
      h1 { color: #075a37; line-height: 1.2; }
      section { background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0; }
      a { color: #168a5b; font-weight: 700; }
      .fecha { color: #64748b; font-size: 14px; }
    </style>
  </head>
  <body>
    <main>
      <h1>${titulo}</h1>
      <p class="fecha">Ultima actualizacion: 2 de julio de 2026</p>
      <section>${contenido}</section>
    </main>
  </body>
</html>`;
}
