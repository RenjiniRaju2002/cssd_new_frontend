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
  console.log(`API GET: ${BASE_URL}${endpoint}`);
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    console.log(`API GET Response Status: ${res.status}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API GET Error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`API GET error: ${res.status} ${res.statusText} - ${errorText}`);
    }
    const data = await res.json();
    console.log('API GET Success:', data);
    return data;
  } catch (error) {
    console.error('API GET Exception:', error);
    throw error;
  }
}

export async function apiPost(endpoint: string, data: any) {
  console.log(`API POST: ${BASE_URL}${endpoint}`, data);
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    console.log(`API POST Response Status: ${res.status}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API POST Error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`API POST error: ${res.status} ${res.statusText} - ${errorText}`);
    }
    const responseData = await res.json();
    console.log('API POST Success:', responseData);
    return responseData;
  } catch (error) {
    console.error('API POST Exception:', error);
    throw error;
  }
}

export async function apiPut(endpoint: string, data: any) {
  console.log(`API PUT: ${BASE_URL}${endpoint}`, data);
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    console.log(`API PUT Response Status: ${res.status}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API PUT Error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`API PUT error: ${res.status} ${res.statusText} - ${errorText}`);
    }
    const responseData = await res.json();
    console.log('API PUT Success:', responseData);
    return responseData;
  } catch (error) {
    console.error('API PUT Exception:', error);
    throw error;
  }
}

export async function apiDelete(endpoint: string) {
  console.log(`API DELETE: ${BASE_URL}${endpoint}`);
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    console.log(`API DELETE Response Status: ${res.status}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API DELETE Error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`API DELETE error: ${res.status} ${res.statusText} - ${errorText}`);
    }
    const responseData = await res.json();
    console.log('API DELETE Success:', responseData);
    return responseData;
  } catch (error) {
    console.error('API DELETE Exception:', error);
    throw error;
  }
} 
