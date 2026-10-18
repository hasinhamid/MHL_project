import { trades, type Provider, type ServiceRequest, type Trade } from '@/types';

const REQUESTS_KEY = 'kaajbondhu-requests';
const AREA_KEY = 'kaajbondhu-area';
const oldTrades: Record<string, Trade> = { 'locksmith/key maker': 'locksmith', 'ac technician': 'ac_technician', 'appliance repair technician': 'appliance_repair' };

function migrateRequest(value: unknown): ServiceRequest | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (['id', 'name', 'phone', 'address', 'createdAt'].some(key => typeof record[key] !== 'string')) return null;
  if (!Number.isFinite(Date.parse(record.createdAt as string))) return null;
  const p = record.provider as Record<string, unknown> | null;
  if (!p || typeof p.id !== 'string' || typeof p.name !== 'string' || typeof p.trade !== 'string') return null;
  const trade = oldTrades[p.trade] || p.trade;
  if (!Object.hasOwn(trades, trade) || !Array.isArray(p.areas) || !p.areas.every(area => typeof area === 'string')) return null;
  if (['fee_min', 'fee_max', 'experience_years'].some(key => typeof p[key] !== 'number' || !Number.isFinite(p[key]))) return null;
  if (typeof p.available !== 'boolean') return null;
  const provider: Provider = {
    id: p.id, name: p.name, trade: trade as Trade, areas: p.areas,
    fee_min: p.fee_min as number, fee_max: p.fee_max as number, experience_years: p.experience_years as number,
    available: p.available, phone: typeof p.phone === 'string' ? p.phone : null,
    source: p.source === 'registered' ? 'registered' : 'seed', demo: true,
  };
  return {
    id: record.id as string, name: record.name as string, phone: record.phone as string,
    address: record.address as string, createdAt: record.createdAt as string, provider,
    area: typeof record.area === 'string' ? record.area : '',
    note: typeof record.note === 'string' ? record.note : '',
    problem_summary: typeof record.problem_summary === 'string' ? record.problem_summary : `${trades[provider.trade]} service`,
    status: 'Pending',
  };
}

export function loadRequests(): { requests: ServiceRequest[]; warning: string } {
  try {
    const saved = localStorage.getItem(REQUESTS_KEY);
    if (!saved) return { requests: [], warning: '' };
    const values: unknown = JSON.parse(saved);
    if (!Array.isArray(values)) throw new Error('Invalid storage');
    const requests = values.map(migrateRequest).filter((item): item is ServiceRequest => item !== null);
    return { requests, warning: requests.length === values.length ? '' : 'Some old request records could not be read. Their original data has been left in browser storage.' };
  } catch {
    return { requests: [], warning: 'Saved requests could not be read. Check browser storage access before saving a new request.' };
  }
}

export function saveRequests(requests: ServiceRequest[]) {
  // Preserve unreadable previous data before replacing the primary key.
  const existing = localStorage.getItem(REQUESTS_KEY);
  if (existing && loadRequests().warning) localStorage.setItem(`${REQUESTS_KEY}-backup-${Date.now()}`, existing);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function loadArea() { try { return localStorage.getItem(AREA_KEY) || ''; } catch { return ''; } }
export function saveArea(area: string) { try { localStorage.setItem(AREA_KEY, area); } catch { /* Selection still works for this session. */ } }
