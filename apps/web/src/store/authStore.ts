import { create } from "zustand";

type AuthState = {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
};

const KEY = "drive_token";

const readInitial = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: readInitial(),
  setToken: (token) => {
    try {
      localStorage.setItem(KEY, token);
    } catch {
      // ignore storage errors
    }
    set({ token });
  },
  logout: () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore storage errors
    }
    set({ token: null });
  },
}));