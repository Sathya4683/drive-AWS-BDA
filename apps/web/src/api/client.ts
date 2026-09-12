import axios from "axios";

const TOKEN_KEY = "drive_token";

const baseURL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

export const getErrorMessage = (err: unknown): string => {
  if (typeof err === "object" && err !== null) {
    const e = err as { response?: { data?: { message?: string } } };
    return e.response?.data?.message ?? "Something went wrong";
  }
  return "Something went wrong";
};