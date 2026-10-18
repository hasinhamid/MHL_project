import { useState, type FormEvent } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowRight, Check, X } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { ContactLink } from './ProviderCard';
import { errorMessage, validPhone } from '@/lib/api';
import { trades, type Booking, type ServiceRequest } from '@/types';

export default function RequestForm({ booking, area, onClose, onSave }: { booking: Booking; area: string; onClose: () => void; onSave: (request: ServiceRequest) => void }) {
  const [form, setForm] = useState({ name: '', phone: '', address: area, problem_summary: booking.summary, note: '' });
  const [submitted, setSubmitted] = useState<ServiceRequest | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (!validPhone(form.phone)) { setError('Enter a Bangladesh mobile number, e.g. 01712345678.'); return; }
    if (![form.name, form.address, form.problem_summary].every(value => value.trim())) { setError('Enter your name, address, and a short description.'); return; }
    setSaving(true);
    try {
      const request: ServiceRequest = {
        id: `KB-${crypto.randomUUID()}`, provider: booking.provider, area,
        ...Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as typeof form,
        status: 'Pending', createdAt: new Date().toISOString(),
      };
      onSave(request); setSubmitted(request);
    } catch (error) { setError(errorMessage(error)); }
    finally { setSaving(false); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-[#153d37]/40" /><Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 text-foreground shadow-2xl outline-none">
      <Dialog.Close aria-label="Close dialog" className="absolute top-5 right-5 rounded-lg p-2 text-[#607a74]"><X className="size-5" /></Dialog.Close>
      {submitted ? <div className="pt-3 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-primary"><Check className="size-7" /></div><Dialog.Title className="mt-4 text-2xl font-bold">Request saved!</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-[#607a74]">Your request for {submitted.provider.name} is saved on this browser. Contact the worker directly to arrange the visit; no notification has been sent.</Dialog.Description><div className="my-5 rounded-xl bg-[#f5faf8] p-4 text-left text-sm"><p className="font-semibold">Status: Pending</p><p className="mt-2 text-xs break-all text-[#607a74]">{submitted.id}</p><p className="mt-2">{submitted.address}</p></div><ContactLink provider={submitted.provider} /><Link to="/requests" onClick={onClose} className="mt-5 block rounded-xl bg-primary px-4 py-3 font-semibold text-white">View my requests</Link></div> : <>
        <p className="eyebrow pr-10">Request a service</p><Dialog.Title className="mt-2 pr-8 text-2xl font-bold">Contact {booking.provider.name}</Dialog.Title><Dialog.Description className="mt-2 text-sm text-[#607a74]">{trades[booking.provider.trade]} · ৳{booking.provider.fee_min}–{booking.provider.fee_max}. Saved locally for this demo; arrange your visit directly.</Dialog.Description>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <label className="text-sm font-semibold">Your name<input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={event => update('name', event.target.value)} className="field mt-2" /></label>
          <label className="text-sm font-semibold">Phone number<input required type="tel" autoComplete="tel" maxLength={24} placeholder="01712345678" value={form.phone} onChange={event => update('phone', event.target.value)} className="field mt-2" /></label>
          <label className="text-sm font-semibold">Service address<input required maxLength={300} autoComplete="street-address" value={form.address} onChange={event => update('address', event.target.value)} className="field mt-2" /></label>
          <label className="text-sm font-semibold">What needs doing?<textarea required maxLength={1000} value={form.problem_summary} onChange={event => update('problem_summary', event.target.value)} className="field mt-2 min-h-20" /></label>
          <label className="text-sm font-semibold">Additional note <span className="font-normal">(optional)</span><textarea maxLength={1000} value={form.note} onChange={event => update('note', event.target.value)} className="field mt-2 min-h-20" /></label>
          {error && <p role="alert" className="error">{error}</p>}
          <Button type="submit" disabled={saving} className="h-12 rounded-xl">{saving ? 'Saving…' : 'Save service request'} <ArrowRight /></Button>
        </form>
      </>}
    </Dialog.Popup></Dialog.Portal>
  </Dialog.Root>;
}
