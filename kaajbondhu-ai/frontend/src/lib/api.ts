import type { AssistantResult, ChatMessage, Provider, Trade, WorkerApplication } from '@/types';

const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}, timeout = 10000): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeout);
  const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...options, signal });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const detail = body?.detail;
      const message = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map((item: { msg: string }) => item.msg).join('. ')
        : 'The service could not complete your request. Please try again.';
      throw new Error(message);
    }
    return await response.json() as T;
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (timeoutSignal.aborted) throw new Error('This is taking longer than expected. Please try again.');
    if (error instanceof TypeError) throw new Error('Cannot reach the backend. Check that the API is running, then retry.');
    throw error;
  }
}

export const api = {
  health: (signal?: AbortSignal) => request<{ status: string; ai_mode: 'demo' | 'live' }>('/api/health', { signal }),
  areas: (signal?: AbortSignal) => request<string[]>('/api/areas', { signal }),
  assistant: (message: string, history: ChatMessage[], signal?: AbortSignal) => request<AssistantResult>('/api/assistant', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: history.slice(-12) }), signal,
  }, 35000),
  providers: (filters: { trade?: Trade; area?: string; available?: boolean; limit?: number }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, String(value));
    return request<Provider[]>(`/api/providers?${params}`, { signal });
  },
  register: (worker: WorkerApplication) => request<Provider>('/api/workers', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(worker),
  }),
};

export function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }

export function validPhone(phone: string) { return /^(?:\+?88)?01[3-9]\d{8}$/.test(phone.replace(/[\s()-]/g, '')); }
