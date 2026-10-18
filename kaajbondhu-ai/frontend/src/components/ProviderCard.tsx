import { ArrowRight, Clock3, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validPhone } from '@/lib/api';
import { trades, type Provider } from '@/types';

export function ContactLink({ provider }: { provider: Provider }) {
  return provider.phone && validPhone(provider.phone)
    ? <a href={`tel:${provider.phone.replace(/[\s()-]/g, '')}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><Phone className="size-4" /> Call {provider.name.split(' ')[0]}</a>
    : <span className="text-xs text-[#607a74]">Fictional demo contact · Calling unavailable</span>;
}

export default function ProviderCard({ provider, onSelect }: { provider: Provider; onSelect: (provider: Provider) => void }) {
  return <article className="panel flex flex-col transition hover:border-[#9bc9be] hover:shadow-[0_12px_32px_rgba(16,75,65,.08)]">
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e7f5f1] text-sm font-bold text-primary">{provider.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</div><div><h3 className="font-bold">{provider.name}</h3><p className="mt-0.5 text-sm text-[#607a74]">{trades[provider.trade]}</p></div></div><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${provider.available ? 'bg-[#e7f5f1] text-primary' : 'bg-amber-50 text-amber-800'}`}>{provider.available ? 'Available' : 'Unavailable'}</span></div>
    <div className="my-4 flex flex-wrap gap-x-4 gap-y-2 border-y py-3 text-xs text-[#607a74]"><span className="flex items-center gap-1"><MapPin className="size-3.5" /> {provider.areas.join(', ')}</span><span className="flex items-center gap-1"><Clock3 className="size-3.5" /> {provider.experience_years} yrs exp.</span><span className="font-semibold text-[#345e56]">৳{provider.fee_min.toLocaleString()}–{provider.fee_max.toLocaleString()}</span></div>
    {provider.match_reason && <p className={`mb-3 text-xs leading-5 ${provider.coverage === 'other' ? 'text-amber-800' : 'text-[#45645e]'}`}>{provider.match_reason}</p>}
    <p className="mb-4 text-[11px] text-[#607a74]">{provider.source === 'seed' ? 'Fictional demo professional' : 'Community demo listing · Unverified'} · Estimated service fee</p>
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3"><ContactLink provider={provider} /><Button onClick={() => onSelect(provider)} disabled={!provider.available} className="h-10 rounded-xl">Request service <ArrowRight className="size-4" /></Button></div>
  </article>;
}
