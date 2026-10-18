import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import AppLayout from '@/components/AppLayout';
import RequestForm from '@/components/RequestForm';
import { Button } from '@/components/ui/button';
import Home from '@/pages/Home';
import Marketplace from '@/pages/Marketplace';
import MyRequests from '@/pages/MyRequests';
import WorkWithUs from '@/pages/WorkWithUs';
import { api, errorMessage } from '@/lib/api';
import { loadArea, loadRequests, saveArea, saveRequests } from '@/lib/storage';
import type { Booking, ChatState, ServiceRequest } from '@/types';

export default function App() {
  const [initial] = useState(loadRequests);
  const [requests, setRequests] = useState(initial.requests);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  const [area, setArea] = useState(loadArea);
  const [areas, setAreas] = useState<string[]>([]);
  const [mode, setMode] = useState<'demo' | 'live' | null>(null);
  const [connectionError, setConnectionError] = useState('');
  const [retry, setRetry] = useState(0);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [chat, setChat] = useState<ChatState>({ messages: [], result: null, draft: '' });
  useEffect(() => {
    const controller = new AbortController();
    setConnectionError('');
    Promise.all([api.health(controller.signal), api.areas(controller.signal)])
      .then(([health, areas]) => { setMode(health.ai_mode); setAreas(areas); setArea(previous => areas.includes(previous) ? previous : ''); })
      .catch(error => { if (!controller.signal.aborted) { setMode(null); setConnectionError(errorMessage(error)); } });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    function restore(event: StorageEvent) {
      if (event.key === 'kaajbondhu-requests' || event.key === null) { const loaded = loadRequests(); setRequests(loaded.requests); setStorageWarning(loaded.warning); }
    }
    window.addEventListener('storage', restore);
    return () => window.removeEventListener('storage', restore);
  }, []);
  function changeArea(value: string) { setArea(value); saveArea(value); }
  function save(request: ServiceRequest) {
    try {
      // Include requests saved in another tab since this component last rendered.
      const next = [request, ...loadRequests().requests];
      saveRequests(next); setRequests(next); setStorageWarning('');
    } catch { throw new Error('Your request could not be saved. Enable browser storage or free up space, then try again.'); }
  }
  return <AppLayout count={requests.length} mode={mode}>
    {connectionError && <div role="alert" className="error mb-6">{connectionError}<Button onClick={() => setRetry(value => value + 1)} className="mt-3 block">Retry connection</Button></div>}
    {storageWarning && <p role="status" className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{storageWarning}</p>}
    <Routes>
      <Route path="/" element={<Home area={area} areas={areas} onAreaChange={changeArea} chat={chat} setChat={setChat} requests={requests} onBook={setBooking} mode={mode} />} />
      <Route path="/marketplace" element={<Marketplace area={area} areas={areas} onAreaChange={changeArea} onBook={setBooking} />} />
      <Route path="/requests" element={<MyRequests requests={requests} />} />
      <Route path="/work-with-us" element={<WorkWithUs areas={areas} />} />
      <Route path="*" element={<section className="panel text-center"><h1 className="text-3xl font-bold">Page not found</h1><Link to="/" className="mt-5 inline-block font-semibold text-primary">Return to the smart finder</Link></section>} />
    </Routes>
    {booking && <RequestForm key={booking.provider.id} booking={booking} area={area} onClose={() => setBooking(null)} onSave={save} />}
  </AppLayout>;
}
