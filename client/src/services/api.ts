import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// ========== 用户 ==========

export interface User {
  id: string;
  nickname: string;
  balance: number;
}

export async function loginOrRegister(nickname: string, password: string): Promise<User> {
  const { data } = await api.post('/users', { nickname, password });
  return data;
}

export async function getWallet(userId: string): Promise<{ userId: string; balance: number }> {
  const { data } = await api.get(`/users/${userId}/wallet`);
  return data;
}

export async function recharge(userId: string, amount: number) {
  const { data } = await api.post(`/users/${userId}/recharge`, { amount });
  return data;
}

export async function getTransactions(userId: string) {
  const { data } = await api.get(`/users/${userId}/transactions`);
  return data;
}

// ========== 红包 ==========

export interface MorseEvent {
  type: 'tone';
  start: number;
  duration: number;
}

export interface MorseTimeline {
  events: MorseEvent[];
  totalDuration: number;
  morseString: string;
}

export interface ClaimInfo {
  id?: string;
  claimer: { id: string; nickname: string };
  amount: number;
  createdAt: string;
}

export interface EnvelopeDetail {
  id: string;
  sender: { id: string; nickname: string };
  amount?: number;
  totalCount: number;
  claimedCount: number;
  bookName: string;
  bookExcerpt: string;
  morseCode: string;
  morseTimeline: MorseTimeline;
  status: 'pending' | 'claimed' | 'expired';
  createdAt: string;
  expiresAt: string;
  claims: ClaimInfo[];
}

export interface CreateEnvelopeResult {
  id: string;
  amount: number;
  totalCount: number;
  bookName: string;
  bookExcerpt: string;
  answer: string;
  answerPinyin: string[];
  morseCode: string;
  morseTimeline: MorseTimeline;
  expiresAt: string;
}

export async function createEnvelope(senderId: string, amount: number, count: number = 1): Promise<CreateEnvelopeResult> {
  const { data } = await api.post('/envelopes', { senderId, amount, count });
  return data;
}

export async function getEnvelope(envelopeId: string): Promise<EnvelopeDetail> {
  const { data } = await api.get(`/envelopes/${envelopeId}`);
  return data;
}

export async function claimEnvelope(envelopeId: string, userId: string, answer: string) {
  const { data } = await api.post(`/envelopes/${envelopeId}/claim`, { userId, answer });
  return data;
}

export async function getEnvelopeList(): Promise<any[]> {
  const { data } = await api.get('/envelopes');
  return data;
}
