import { LegalPage } from '@/components/legal-page';

export default function Soporte() {
  return (
    <LegalPage
      titulo="Soporte"
      subtitulo="Ayuda y contacto"
      parrafos={[
        'Correo oficial de soporte: soporte@mi-san.app.',
        'Tiempo estimado de respuesta: 2 a 5 dias laborables durante la primera etapa comercial.',
        'Incluye en tu mensaje el correo de tu cuenta, una descripcion clara del problema y capturas si ayudan a entender el caso.',
      ]}
    />
  );
}
