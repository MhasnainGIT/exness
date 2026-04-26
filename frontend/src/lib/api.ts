// Use relative URL so Vite dev proxy forwards to http://localhost:5000
export const API_BASE = '/api';
export const WS_URL = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:5000/ws';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error((data as any)?.message || response.statusText);
  }

  return (data as any)?.data !== undefined ? (data as any).data : data;
}
