import { apiFetch } from '../utils/api';
import type {
  LoginCredentials,
  SignupCredentials,
  LoginResponse,
  SignupResponse,
  RefreshResponse,
} from '../types';

const AUTH_BASE = '/auth';

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(`${AUTH_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function signup(credentials: SignupCredentials): Promise<SignupResponse> {
  const { confirmPassword: _, ...body } = credentials;
  return apiFetch<SignupResponse>(`${AUTH_BASE}/signup`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function logout(): Promise<void> {
  await apiFetch(`${AUTH_BASE}/logout`, { method: 'POST', credentials: 'include' });
}

export async function refresh(): Promise<RefreshResponse> {
  return apiFetch<RefreshResponse>(`${AUTH_BASE}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
}
