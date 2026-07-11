import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type Usuario } from '@/services/auth-service';

type AuthState = {
  usuario: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
  mensajeSesionExpirada: string | null;
  hydrated: boolean;
  marcarHidratado: () => void;
  guardarSesion: (data: { usuario: Usuario; accessToken: string; refreshToken: string; refreshTokenExpiresAt: string }) => void;
  actualizarUsuario: (usuario: Usuario) => void;
  actualizarTokens: (tokens: { accessToken: string; refreshToken: string; refreshTokenExpiresAt: string }) => void;
  cerrarSesion: (mensajeSesionExpirada?: string) => void;
  limpiarMensajeSesionExpirada: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      mensajeSesionExpirada: null,
      hydrated: false,
      marcarHidratado: () => set({ hydrated: true }),
      guardarSesion: (data) => set({ ...data, mensajeSesionExpirada: null }),
      actualizarUsuario: (usuario) => set({ usuario }),
      actualizarTokens: (tokens) => set(tokens),
      cerrarSesion: (mensajeSesionExpirada) =>
        set({
          usuario: null,
          accessToken: null,
          refreshToken: null,
          refreshTokenExpiresAt: null,
          mensajeSesionExpirada: mensajeSesionExpirada ?? null,
        }),
      limpiarMensajeSesionExpirada: () => set({ mensajeSesionExpirada: null }),
    }),
    {
      name: 'mi-san-auth',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.marcarHidratado();
      },
    },
  ),
);
