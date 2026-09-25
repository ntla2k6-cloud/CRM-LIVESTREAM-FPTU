// Luôn dùng Next.js API proxy route để tránh CORS và biến môi trường
// Proxy route: /api/backend/[...slug] → NestJS backend
const API_BASE = '/api/backend';

// Fallback nếu chạy local (dev mode không qua proxy)
const DIRECT_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_BASE_URL = typeof window !== 'undefined' ? API_BASE : DIRECT_BASE;

export const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch (networkError: any) {
    throw new Error(`Không thể kết nối máy chủ: ${networkError.message}`);
  }

  if (!res.ok) {
    let errMsg = `Lỗi ${res.status}`;
    try { 
      const errData = await res.json();
      errMsg = errData?.message || errMsg;
    } catch {}
    throw new Error(errMsg);
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

// api.get/post/patch/delete trả về { data } để tương thích ngược với code cũ
export const api = {
  get: async (endpoint: string) => {
    const data = await fetchApi(endpoint);
    return { data };
  },
  post: async (endpoint: string, body: any) => {
    const data = await fetchApi(endpoint, { method: 'POST', body: JSON.stringify(body) });
    return { data };
  },
  patch: async (endpoint: string, body: any) => {
    const data = await fetchApi(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
    return { data };
  },
  delete: async (endpoint: string) => {
    const data = await fetchApi(endpoint, { method: 'DELETE' });
    return { data };
  }
};
