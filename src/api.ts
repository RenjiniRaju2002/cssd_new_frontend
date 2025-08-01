// const BASE_URL = 'http://192.168.50.95:3001';
const getBaseURL = (): string => {
  // Check if we're in development or production
  if (import.meta.env.DEV) {
      // In development, use localhost to match backend
      return 'http://localhost:3001/api';
  } else {
    // In production, use the actual server URL
    // You can set this via environment variable
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }
};
  const BASE_URL=getBaseURL();

export async function apiGet(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error('API GET error');
  return res.json();
}

export async function apiPost(endpoint: string, data: any) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('API POST error');
  return res.json();
}

export async function apiPut(endpoint: string, data: any) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('API PUT error');
  return res.json();
}

export async function apiDelete(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('API DELETE error');
  return res.json();
} 
