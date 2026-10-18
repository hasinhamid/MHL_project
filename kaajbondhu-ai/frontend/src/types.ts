export const trades = {
  plumber: 'Plumber', electrician: 'Electrician', locksmith: 'Locksmith / key maker',
  carpenter: 'Carpenter', ac_technician: 'AC technician', appliance_repair: 'Appliance repair', home_helper: 'Home helper',
} as const;
export type Trade = keyof typeof trades;
export type Provider = {
  id: string; name: string; trade: Trade; areas: string[];
  fee_min: number; fee_max: number; experience_years: number; available: boolean;
  phone: string | null; source: 'seed' | 'registered'; demo: boolean;
  match_reason?: string | null; coverage?: 'local' | 'adjacent' | 'other' | 'unspecified';
};
export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type AssistantResult = {
  intent: 'clarification' | 'recommendation' | 'unsupported'; problem_summary: string;
  recommended_trade: Trade | 'other'; urgency: 'normal' | 'urgent' | 'emergency';
  confidence: number; follow_up_question: string | null; safety_warning: string | null;
  source: 'demo' | 'live';
};
export type ChatState = { messages: ChatMessage[]; result: AssistantResult | null; draft: string };
export type ServiceRequest = {
  id: string; provider: Provider; name: string; phone: string; area: string; address: string;
  problem_summary: string; note: string; status: 'Pending'; createdAt: string;
};
export type WorkerApplication = {
  name: string; phone: string; trade: Trade; areas: string[]; experience_years: number;
  fee_min: number; fee_max: number; note: string;
};
export type Booking = { provider: Provider; summary: string };
