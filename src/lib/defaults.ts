import type { AppConfig, LivePayment, PlanItem } from '../types';

export const DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'vip-1',
    name: 'VIP ১ - এক্সপ্রেস কুরিয়ার',
    category: 'daily',
    price: 500,
    dailyIncome: 45,
    cycleDays: 30,
    totalReturn: 1350,
    imageKey: 'vip_express',
    badge: 'জনপ্রিয়',
  },
  {
    id: 'vip-2',
    name: 'VIP ২ - ই-কার্গো ফ্লিট',
    category: 'daily',
    price: 1200,
    dailyIncome: 115,
    cycleDays: 30,
    totalReturn: 3450,
    imageKey: 'vip_express',
  },
  {
    id: 'vip-3',
    name: 'VIP ৩ - এয়ার কার্গো লাইন',
    category: 'daily',
    price: 2500,
    dailyIncome: 250,
    cycleDays: 35,
    totalReturn: 8750,
    imageKey: 'vip_freight',
    badge: 'সেরা চাহিদা',
  },
  {
    id: 'vip-4',
    name: 'VIP ৪ - গ্লোবাল ফ্রেইট',
    category: 'daily',
    price: 5000,
    dailyIncome: 520,
    cycleDays: 35,
    totalReturn: 18200,
    imageKey: 'vip_freight',
  },
  {
    id: 'vip-5',
    name: 'VIP ৫ - প্রাইম কার্গো হাব',
    category: 'daily',
    price: 10000,
    dailyIncome: 1100,
    cycleDays: 40,
    totalReturn: 44000,
    imageKey: 'hero_cargo',
  },
  {
    id: 'vip-6',
    name: 'VIP ৬ - ইন্টারন্যাশনাল জেট',
    category: 'daily',
    price: 25000,
    dailyIncome: 2900,
    cycleDays: 45,
    totalReturn: 130500,
    imageKey: 'hero_network',
    badge: 'সর্বোচ্চ আয়',
  },
  {
    id: 'welfare-1',
    name: 'কল্যাণ প্ল্যান ক - স্মার্ট হাব',
    category: 'welfare',
    price: 800,
    dailyIncome: 100,
    cycleDays: 12,
    totalReturn: 1200,
    imageKey: 'welfare_hub',
    badge: 'দ্রুত রিটার্ন',
  },
  {
    id: 'welfare-2',
    name: 'কল্যাণ প্ল্যান খ - সর্টিং ইউনিট',
    category: 'welfare',
    price: 3000,
    dailyIncome: 420,
    cycleDays: 15,
    totalReturn: 6300,
    imageKey: 'welfare_hub',
  },
  {
    id: 'welfare-3',
    name: 'কল্যাণ প্ল্যান গ - পোর্ট গেটওয়ে',
    category: 'welfare',
    price: 8000,
    dailyIncome: 1200,
    cycleDays: 20,
    totalReturn: 24000,
    imageKey: 'hero_network',
  },
];

export const DEFAULT_APP_CONFIG: AppConfig = {
  rechargeNumbers: {
    bkash: '01813623507',
    nagad: '01923948150',
    rocket: '01768066566',
  },
  telegramLink: 'https://t.me/feedexdigital_official',
  supportLink: 'https://t.me/feedexdigital_support',
  referralRates: {
    level1: 12,
    level2: 5,
    level3: 2,
  },
  signupBonus: 150,
  telegramBonus: 50,
  minDeposit: 300,
  minWithdraw: 200,
  plans: DEFAULT_PLANS,
  updatedAt: new Date().toISOString(),
};

export const SEED_LIVE_PAYMENTS: LivePayment[] = [
  { id: 'lp-1', maskedPhone: '017***842', amount: 1500, method: 'bkash', type: 'withdraw', createdAt: '2026-11-12T18:10:00.000Z' },
  { id: 'lp-2', maskedPhone: '018***319', amount: 2500, method: 'nagad', type: 'deposit', createdAt: '2026-11-12T18:14:00.000Z' },
  { id: 'lp-3', maskedPhone: '019***604', amount: 850, method: 'rocket', type: 'withdraw', createdAt: '2026-11-12T18:18:00.000Z' },
  { id: 'lp-4', maskedPhone: '016***227', amount: 5000, method: 'bkash', type: 'deposit', createdAt: '2026-11-12T18:22:00.000Z' },
  { id: 'lp-5', maskedPhone: '017***991', amount: 3200, method: 'nagad', type: 'withdraw', createdAt: '2026-11-12T18:26:00.000Z' },
  { id: 'lp-6', maskedPhone: '013***415', amount: 1200, method: 'bkash', type: 'deposit', createdAt: '2026-11-12T18:30:00.000Z' },
  { id: 'lp-7', maskedPhone: '019***772', amount: 4500, method: 'rocket', type: 'withdraw', createdAt: '2026-11-12T18:35:00.000Z' },
  { id: 'lp-8', maskedPhone: '018***508', amount: 10000, method: 'bkash', type: 'deposit', createdAt: '2026-11-12T18:40:00.000Z' },
];

export const METHOD_LABELS: Record<'bkash' | 'nagad' | 'rocket', string> = {
  bkash: 'বিকাশ (bKash)',
  nagad: 'নগদ (Nagad)',
  rocket: 'রকেট (Rocket)',
};

export function formatBDT(value: number): string {
  const num = Number(value || 0);
  return `৳ ${num.toLocaleString('en-US', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function maskPhone(phone: string): string {
  const clean = phone.trim();
  if (clean.length < 7) return clean;
  return `${clean.slice(0, 3)}***${clean.slice(-3)}`;
}
