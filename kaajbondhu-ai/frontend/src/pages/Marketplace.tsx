import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Loader2, Search, Wrench } from 'lucide-react';
import AreaSelector from '@/components/AreaSelector';
import ProviderCard from '@/components/ProviderCard';
import { Button } from '@/components/ui/button';
import { api, errorMessage } from '@/lib/api';
import { trades, type Booking, type Provider, type Trade } from '@/types';

export default function Marketplace({ area, areas, onAreaChange, onBook }: { area: string; areas: string[]; onAreaChange: (area: string) => void; onBook: (booking: Booking) => void }) {
  const [params, setParams] = useSearchParams();
  const category = params.get('trade') || '';
  const trade = Object.hasOwn(trades, category) ? category as Trade : undefined;
  const [search, setSearch] = useState('');
  const [available, setAvailable] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setProviders([]);
    api.providers({ trade, area, available: available ? true : undefined }, controller.signal)
      .then(setProviders).catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [trade, area, available, retry]);
  const query = search.trim().toLowerCase();
  const filtered = providers.filter(provider => (!localOnly || !area || ['local', 'adjacent'].includes(provider.coverage || '')) && `${provider.name} ${trades[provider.trade]} ${provider.areas.join(' ')}`.toLowerCase().includes(query));

  return <section className="mx-auto max-w-6xl">
    <div className="rounded-[28px] bg-[#164740] px-6 py-8 text-white shadow-[0_20px_60px_rgba(16,75,65,.12)] sm:px-10 sm:py-10"><div className="max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#b9e6da]"><Wrench className="size-3.5" /> Local help, one place</div><h1 className="text-4xl font-bold tracking-[-.04em] sm:text-5xl">Find someone for the job.</h1><p className="mt-3 text-sm leading-6 text-[#c5ddd8]">From a plumber to a key maker, find people nearby for the everyday jobs that keep your home running.</p></div>
      <label className="mt-7 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2"><Search className="ml-3 size-5 shrink-0 text-[#78918b]" /><span className="sr-only">Search workers</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by service, name, or area" className="h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-sm text-foreground outline-primary" /></label>
    </div>
    <div className="mt-7 flex flex-wrap items-end gap-5"><div className="w-full sm:w-72"><AreaSelector area={area} areas={areas} onChange={onAreaChange} /></div><label className="flex items-center gap-2 py-3 text-sm"><input type="checkbox" checked={available} onChange={event => setAvailable(event.target.checked)} className="size-4 accent-[#0b7b69]" /> Available only</label><label className="flex items-center gap-2 py-3 text-sm"><input type="checkbox" disabled={!area} checked={localOnly} onChange={event => setLocalOnly(event.target.checked)} className="size-4 accent-[#0b7b69]" /> Local & adjacent areas only</label></div>
    <div className="mt-6 flex flex-wrap gap-2" aria-label="Service categories">{[['', 'All services'], ...Object.entries(trades)].map(([value, label]) => <button key={value} aria-pressed={(trade || '') === value} onClick={() => setParams(value ? { trade: value } : {})} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${(trade || '') === value ? 'border-primary bg-primary text-white' : 'bg-white text-[#607a74] hover:border-[#9bc9be]'}`}>{label}</button>)}</div>
    <div className="mt-8"><p className="eyebrow">Browse local workers</p><h2 className="mt-1 text-2xl font-bold">{loading ? 'Finding professionals…' : `${filtered.length} professionals found`}</h2><p className="mt-2 text-xs text-[#607a74]">Fictional and community demo listings · Fees are estimates, confirmed directly with the worker.</p></div>
    {loading ? <p role="status" className="panel mt-5 flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading marketplace…</p> : error ? <div role="alert" className="error mt-5">{error}<Button onClick={() => setRetry(value => value + 1)} className="mt-3 block">Retry marketplace</Button></div> : filtered.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{filtered.map(provider => <ProviderCard key={provider.id} provider={provider} onSelect={provider => onBook({ provider, summary: '' })} />)}</div> : <p className="panel mt-5 py-12 text-center text-sm text-[#607a74]">No workers found. Try another service, neighborhood, or search.</p>}
  </section>;
}
