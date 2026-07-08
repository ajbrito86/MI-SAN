import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type Usuario } from '@/services/auth-service';

type AuthState = {
  usuario: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  marcarHidratado: () => void;
  guardarSesion: (data: { usuario: Usuario; accessToken: string; refreshToken: string }) => void;
  actualizarUsuario: (usuario: Usuario) => void;
  actualizarTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  cerrarSesion: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      marcarHidratado: () => set({ hydrated: true }),
      guardarSesion: (data) => set(data),
      actualizarUsuario: (usuario) => set({ usuario }),
      actualizarTokens: (tokens) => set(tokens),
      cerrarSesion: () => set({ usuario: null, accessToken: null, refreshToken: null }),
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
