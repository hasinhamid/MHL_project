import { useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { ArrowRight, Droplets, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AreaSelector from './AreaSelector';
import { api, errorMessage } from '@/lib/api';
import type { ChatState } from '@/types';

const examples = ['Amar bathroom er tap theke pani porche.', 'Switch on korlei breaker pore jay.', 'My AC is running but not cooling.', 'ঘর পরিষ্কার করার জন্য সাহায্য দরকার।'];

export default function ChatAssistant({ area, areas, onAreaChange, chat, setChat, mode }: {
  area: string; areas: string[]; onAreaChange: (area: string) => void;
  chat: ChatState; setChat: Dispatch<SetStateAction<ChatState>>; mode: 'demo' | 'live' | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const historyEnd = useRef<HTMLDivElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { historyEnd.current?.scrollIntoView({ block: 'nearest' }); }, [chat.messages]);

  async function analyze(event: FormEvent) {
    event.preventDefault();
    const message = chat.draft.trim();
    if (!message || loading) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true); setError('');
    setChat(previous => ({ ...previous, result: null }));
    try {
      const result = await api.assistant(message, chat.messages, current.signal);
      if (current.signal.aborted) return;
      setChat(previous => ({ draft: '', result, messages: [...previous.messages,
        { role: 'user', content: message }, { role: 'assistant', content: [result.problem_summary, result.follow_up_question].filter(Boolean).join(' ') },
      ].slice(-12) as ChatState['messages'] }));
    } catch (error) { if (!current.signal.aborted) setError(errorMessage(error)); }
    finally { if (!current.signal.aborted) setLoading(false); }
  }

  return <div className="relative rounded-[28px] border border-[#d9e9e5] bg-white p-4 shadow-[0_20px_60px_rgba(16,75,65,.08)] sm:p-6">
    <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Problem detective</p><h2 className="mt-1 text-xl font-bold">What needs fixing?</h2></div><div className="grid size-10 place-items-center rounded-xl bg-[#e9f6f2] text-primary"><Droplets className="size-5" /></div></div>
    <div className="mb-4 flex items-center justify-between gap-3 text-xs text-[#607a74]"><span>{mode === 'demo' ? 'Demo AI · Simulated, no model connected' : mode === 'live' ? 'Live AI assistant' : 'Checking AI connection…'}</span>{chat.messages.length > 0 && <button type="button" disabled={loading} className="font-semibold text-primary" onClick={() => { setChat({ messages: [], draft: '', result: null }); setError(''); }}>New conversation</button>}</div>
    <form onSubmit={analyze}>
      {chat.messages.length > 0 && <div role="log" aria-label="Conversation" aria-live="polite" className="mb-4 flex max-h-52 flex-col gap-2 overflow-y-auto rounded-xl bg-[#f5faf8] p-3">{chat.messages.map((turn, index) => <p key={index} className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-5 ${turn.role === 'user' ? 'self-end bg-primary text-white' : 'self-start border bg-white text-[#45645e]'}`}>{turn.content}</p>)}<div ref={historyEnd} /></div>}
      <AreaSelector area={area} areas={areas} onChange={onAreaChange} />
      <label htmlFor="problem" className="mt-4 mb-2 block text-xs font-semibold text-[#64807a]">Describe your problem</label>
      <textarea id="problem" required maxLength={2000} value={chat.draft} onChange={event => setChat(previous => ({ ...previous, draft: event.target.value }))} placeholder="e.g. Amar bathroom er tap theke pani porche..." className="field min-h-32 resize-y bg-[#fbfdfc]" />
      <div className="mt-3 flex flex-wrap gap-2">{examples.map(example => <button type="button" key={example} disabled={loading} onClick={() => setChat(previous => ({ ...previous, draft: example }))} className="rounded-full border px-3 py-1.5 text-left text-[11px] text-[#64807a] transition hover:border-primary hover:text-primary">{example}</button>)}</div>
      {error && <p role="alert" className="error mt-4">{error}</p>}
      <Button type="submit" disabled={loading || !chat.draft.trim()} className="mt-5 h-12 w-full rounded-xl">{loading ? <Loader2 className="animate-spin" /> : <Sparkles />} {loading ? 'Understanding…' : error ? 'Try again' : 'Find the right help'}<ArrowRight /></Button>
    </form>
  </div>;
}
