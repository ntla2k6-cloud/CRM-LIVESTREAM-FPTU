export const API_BASE_URL = 'http://localhost:3001';

export const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

export const StaffAPI = {
  getAll: () => fetchApi('/staff'),
  create: (data: any) => fetchApi('/staff', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number | string, data: any) => fetchApi(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number | string) => fetchApi(`/staff/${id}`, { method: 'DELETE' }),
};

export const LiveSessionAPI = {
  getAll: () => fetchApi('/live-session'),
  getById: (id: string) => fetchApi(`/live-session/${id}`),
  create: (data: any) => fetchApi('/live-session', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/live-session/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const ShiftAPI = {
  getAll: () => fetchApi('/shift'),
  create: (data: any) => fetchApi('/shift', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number | string, data: any) => fetchApi(`/shift/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number | string) => fetchApi(`/shift/${id}`, { method: 'DELETE' }),
  assignStaff: (shiftId: number | string, staffId: number) => fetchApi(`/shift/${shiftId}/assign`, { method: 'POST', body: JSON.stringify({ staffId }) }),
};

export const LeadAPI = {
  getAll: () => fetchApi('/lead'),
  create: (data: any) => fetchApi('/lead', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/lead/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/lead/${id}`, { method: 'DELETE' }),
};
