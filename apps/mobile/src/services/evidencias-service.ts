import { API_BASE_URL } from './api';

export type ArchivoEvidencia = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

export type EvidenciaPago = {
  id: string;
  cuotaPagoId: string;
  urlArchivo: string;
  nombreArchivo: string;
  mimeType: string;
  cargadoPor: string;
  createdAt: string;
};

export async function subirEvidenciaPago(token: string, cuotaPagoId: string, archivo: ArchivoEvidencia) {
  const formData = new FormData();
  formData.append('cuotaPagoId', cuotaPagoId);
  formData.append('archivo', {
    uri: archivo.uri,
    name: archivo.name,
    type: archivo.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/uploads/evidence`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? 'No pudimos subir el comprobante.');
  }

  return data as EvidenciaPago;
}
