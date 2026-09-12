import type {
  LoginResponse,
  VerifyResponse,
  MeUser,
  SignupResponse,
  CredentialsBody,
} from "shared-types";
import { api } from "./client";

export const login = async (body: CredentialsBody): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login", body);
  return data;
};

export const signup = async (
  body: CredentialsBody,
): Promise<SignupResponse> => {
  const { data } = await api.post<SignupResponse>("/auth/signup", body);
  return data;
};

export const verify = async (): Promise<VerifyResponse> => {
  const { data } = await api.post<VerifyResponse>("/auth/verify");
  return data;
};

export const me = async (): Promise<MeUser> => {
  const { data } = await api.get<MeUser>("/auth/me");
  return data;
};