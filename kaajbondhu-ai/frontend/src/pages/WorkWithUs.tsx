import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, errorMessage, validPhone } from '@/lib/api';
import { trades, type Provider, type Trade } from '@/types';

export default function WorkWithUs({ areas }: { areas: string[] }) {
  const [form, setForm] = useState({ name: '', phone: '', trade: 'plumber' as Trade, areas: [] as string[], experience_years: '', fee_min: '', fee_max: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Provider | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    if (!validPhone(form.phone)) { setError('Enter a Bangladesh mobile number, e.g. 01712345678.'); return; }
    if (form.name.trim().length < 2) { setError('Please enter your full name.'); return; }
    if (!form.areas.length) { setError('Choose at least one service area.'); return; }
    if (Number(form.fee_max) < Number(form.fee_min)) { setError('Maximum fee must be at least the minimum fee.'); return; }
    setSubmitting(true);
    try { setCreated(await api.register({ ...form, name: form.name.trim(), experience_years: Number(form.experience_years), fee_min: Number(form.fee_min), fee_max: Number(form.fee_max) })); }
    catch (error) { setError(errorMessage(error)); }
    finally { setSubmitting(false); }
  }
  if (created) return <section className="panel mx-auto max-w-xl py-10 text-center"><Check className="mx-auto size-12 rounded-full bg-muted p-2 text-primary" /><h1 className="mt-4 text-3xl font-bold">You’re in the worker pool!</h1><p className="mt-3 text-sm leading-6 text-[#607a74]">{created.name}, your unverified demo listing is now visible in {created.areas.join(', ')}. Customers can find your service and use your phone number to contact you.</p><Link to={`/marketplace?trade=${created.trade}`} className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">See your listing</Link></section>;
  return <section className="mx-auto max-w-3xl"><p className="eyebrow">Worker registration</p><h1 className="mt-2 text-4xl font-bold tracking-[-.03em]">Work with KaajBondhu</h1><p className="mt-3 text-[#607a74]">Turn your skills into local opportunities. Create a demo listing so people can find and contact you.</p>
    <form onSubmit={submit} className="panel mt-7"><div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Full name<input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="field mt-2" /></label>
      <label className="text-sm font-semibold">Phone number<input required type="tel" autoComplete="tel" maxLength={24} placeholder="01712345678" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className="field mt-2" /></label>
      <label className="text-sm font-semibold">Service trade<select value={form.trade} onChange={event => setForm({ ...form, trade: event.target.value as Trade })} className="field mt-2">{Object.entries(trades).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold">Experience (years)<input required type="number" min={0} max={60} step={1} value={form.experience_years} onChange={event => setForm({ ...form, experience_years: event.target.value })} className="field mt-2" /></label>
      <label className="text-sm font-semibold">Minimum fee (৳)<input required type="number" min={0} max={100000} step={1} value={form.fee_min} onChange={event => setForm({ ...form, fee_min: event.target.value })} className="field mt-2" /></label>
      <label className="text-sm font-semibold">Maximum fee (৳)<input required type="number" min={Number(form.fee_min)} max={100000} step={1} value={form.fee_max} onChange={event => setForm({ ...form, fee_max: event.target.value })} className="field mt-2" /></label>
    </div>
      <fieldset className="mt-5"><legend className="text-sm font-semibold">Service areas <span className="font-normal text-[#607a74]">(choose up to 8)</span></legend><div className="mt-3 flex flex-wrap gap-2">{areas.map(area => <label key={area} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${form.areas.includes(area) ? 'border-primary bg-muted text-primary' : ''}`}><input type="checkbox" className="accent-[#0b7b69]" checked={form.areas.includes(area)} disabled={!form.areas.includes(area) && form.areas.length >= 8} onChange={event => setForm({ ...form, areas: event.target.checked ? [...form.areas, area] : form.areas.filter(value => value !== area) })} />{area}</label>)}</div>{!areas.length && <p className="mt-2 text-sm text-amber-800">Service areas are unavailable. Retry the backend connection above.</p>}</fieldset>
      <label className="mt-5 block text-sm font-semibold">Additional details <span className="font-normal">(optional)</span><textarea maxLength={1000} value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} className="field mt-2 min-h-24" /></label>
      <p className="mt-4 text-xs leading-5 text-[#607a74]">Your name, service areas, fees, and contact number will appear in the demo marketplace. This creates an unverified listing; jobs and earnings are arranged directly.</p>
      {error && <p role="alert" className="error mt-4">{error}</p>}
      <Button type="submit" disabled={submitting || !areas.length} className="mt-5 h-12 w-full rounded-xl">{submitting ? <Loader2 className="animate-spin" /> : <ArrowRight />} {submitting ? 'Creating your listing…' : 'Join the worker pool'}</Button>
    </form>
  </section>;
}
