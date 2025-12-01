import axios from 'axios';
import { Ticket, Job, JobItem, TicketListResponse } from '@/types/api.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const ticketApi = {
  getAll: async (page: number = 1, limit: number = 20): Promise<TicketListResponse> => {
    const response = await api.get('/tickets', { params: { page, limit } });
    return response.data;
  },
  getById: async (id: string): Promise<Ticket> => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },
  create: async (data: { title: string; description?: string; status?: string }): Promise<Ticket> => {
    const response = await api.post('/tickets', data);
    return response.data;
  },
  update: async (id: string, data: { title?: string; description?: string; status?: string }): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },
};

export const jobApi = {
  create: async (data: { type: string; payload: any; idempotencyKey?: string }): Promise<Job> => {
    const headers: Record<string, string> = {};
    if (data.idempotencyKey) {
      headers['Idempotency-Key'] = data.idempotencyKey;
    }
    const response = await api.post('/jobs', {
      type: data.type,
      payload: data.payload,
    }, { headers });
    return response.data;
  },
  getById: async (id: string): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
  getAll: async (filters?: { type?: string; status?: string }): Promise<Job[]> => {
    const response = await api.get('/jobs', { params: filters });
    return response.data;
  },
  cancel: async (id: string): Promise<{ id: string; status: string; message: string }> => {
    const response = await api.post(`/jobs/${id}/cancel`);
    return response.data;
  },
};
