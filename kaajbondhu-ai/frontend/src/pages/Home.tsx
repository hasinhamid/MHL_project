import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import ChatAssistant from '@/components/ChatAssistant';
import ProviderCard from '@/components/ProviderCard';
import { Button } from '@/components/ui/button';
import { api, errorMessage } from '@/lib/api';
import { trades, type Booking, type ChatState, type Provider, type ServiceRequest } from '@/types';

export default function Home({ area, areas, onAreaChange, chat, setChat, requests, onBook, mode }: {
  area: string; areas: string[]; onAreaChange: (area: string) => void; chat: ChatState;
  setChat: Dispatch<SetStateAction<ChatState>>; requests: ServiceRequest[];
  onBook: (booking: Booking) => void; mode: 'demo' | 'live' | null;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const result = chat.result;
  useEffect(() => {
    setProviders([]); setError('');
    if (!result || result.intent !== 'recommendation' || result.recommended_trade === 'other') { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    api.providers({ trade: result.recommended_trade, area, limit: 3 }, controller.signal)
      .then(setProviders).catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [result, area, retry]);

  return <>
    <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
      <div><div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#e7f5f1] px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> Smart help for your home</div>
        <h1 className="max-w-xl text-4xl leading-[1.08] font-bold tracking-[-0.04em] text-[#163d37] sm:text-6xl">Describe the problem.<br /><span className="text-primary">We’ll find the right help.</span></h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-[#607a74]">Tell us what’s happening in Bangla, Banglish, or English. KaajBondhu understands the issue and helps you find a local professional.</p>
        <div className="mt-7 flex flex-wrap gap-3 text-xs text-[#607a74]">{['Local professionals', 'Clear pricing', 'Simple requests'].map(label => <span key={label} className="flex items-center gap-1.5"><Check className="size-4 text-primary" />{label}</span>)}</div>
      </div>
      <ChatAssistant area={area} areas={areas} onAreaChange={onAreaChange} chat={chat} setChat={setChat} mode={mode} />
    </section>
    {result && <section aria-label="Assistant result" aria-live="polite" className="mt-14 grid items-start gap-6 lg:grid-cols-[.82fr_1.18fr]">
      <div className="panel"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Your recommendation</p><h2 className="mt-2 text-2xl font-bold">{result.intent === 'clarification' ? 'Let’s narrow it down' : result.intent === 'unsupported' ? 'Outside our services' : result.recommended_trade === 'other' ? 'More information needed' : trades[result.recommended_trade]}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.urgency === 'emergency' ? 'bg-red-50 text-red-800' : result.urgency === 'urgent' ? 'bg-[#fff0db] text-[#a76511]' : 'bg-[#e7f5f1] text-primary'}`}>{result.urgency}</span></div>
        <p className="mt-4 text-sm leading-6 text-[#607a74]">{result.problem_summary}</p>
        {result.safety_warning && <div className="mt-5 flex gap-3 rounded-xl bg-[#fff4e5] p-3.5 text-sm text-[#925a11]"><ShieldAlert className="mt-0.5 size-5 shrink-0" /><span>{result.safety_warning}</span></div>}
        {result.follow_up_question && <div className="mt-5 rounded-xl bg-[#f0f8f6] p-4 text-sm text-[#41665f]"><p className="font-semibold">One quick question</p><p className="mt-1">{result.follow_up_question}</p><p className="mt-2 text-xs">Reply in the problem box above.</p></div>}
        <p className="mt-6 flex items-center gap-2 border-t pt-4 text-xs text-[#607a74]"><Sparkles className="size-3.5 text-primary" />{result.source === 'demo' ? 'Simulated demo recommendation' : `Model confidence ${Math.round(result.confidence * 100)}% · Not a diagnosis`}</p>
      </div>
      {result.intent === 'recommendation' && <div><div className="mb-4"><p className="eyebrow">Recommended professionals</p><h2 className="mt-1 text-2xl font-bold">People who can help</h2><p className="mt-2 text-xs text-[#607a74]">Demo listings · Ranked by service coverage, availability, and experience</p></div>
        {loading ? <p role="status" className="panel flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Finding professionals…</p> : error ? <div role="alert" className="error">{error}<Button onClick={() => setRetry(value => value + 1)} className="mt-3 block">Retry worker search</Button></div> : providers.length ? <div className="flex flex-col gap-3">{providers.map(provider => <ProviderCard key={provider.id} provider={provider} onSelect={provider => onBook({ provider, summary: result.problem_summary })} />)}</div> : <p className="panel text-sm text-[#607a74]">No matching workers yet. Try the marketplace or another service.</p>}
      </div>}
    </section>}
    <section className="mt-14"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Already know what you need?</p><h2 className="mt-2 text-2xl font-bold">Find help your way</h2></div><Link to="/marketplace" className="flex items-center gap-2 text-sm font-semibold text-primary">Browse all workers <ArrowRight className="size-4" /></Link></div><div className="mt-5 flex flex-wrap gap-2">{Object.entries(trades).map(([trade, label]) => <Link key={trade} to={`/marketplace?trade=${trade}`} className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-[#45645e] transition hover:border-primary hover:text-primary">{label}</Link>)}</div></section>
    <section className="panel mt-8 flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Your dashboard</p><h2 className="mt-2 text-xl font-bold">{requests.length} saved service {requests.length === 1 ? 'request' : 'requests'}</h2><p className="mt-2 text-sm text-[#607a74]">{requests[0] ? `Latest: ${requests[0].provider.name} · ${requests[0].status}` : 'Your first request is just a few clicks away.'}</p></div><Link to="/requests" className="font-semibold text-primary">View my requests →</Link></section>
  </>;
}
