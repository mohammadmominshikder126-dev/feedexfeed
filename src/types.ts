export type PaymentMethod = 'bkash' | 'nagad' | 'rocket';

export type PlanCategory = 'daily' | 'welfare';

export type PlanImageKey =
  | 'vip_express'
  | 'vip_freight'
  | 'welfare_hub'
  | 'hero_cargo'
  | 'hero_network';

export interface PlanItem {
  id: string;
  name: string;
  category: PlanCategory;
  price: number;
  dailyIncome: number;
  cycleDays: number;
  totalReturn: number;
  imageKey: PlanImageKey;
  badge?: string;
}

export interface RechargeNumbers {
  bkash: string;
  nagad: string;
  rocket: string;
}

export interface ReferralRates {
  level1: number;
  level2: number;
  level3: number;
}

export interface AppConfig {
  rechargeNumbers: RechargeNumbers;
  telegramLink: string;
  supportLink: string;
  referralRates: ReferralRates;
  signupBonus: number;
  telegramBonus: number;
  minDeposit: number;
  minWithdraw: number;
  plans: PlanItem[];
  updatedAt: string;
}

export interface Member {
  id: string;
  phone: string;
  passwordHash: string;
  withdrawPasswordHash: string;
  balance: number;
  totalRecharge: number;
  totalWithdraw: number;
  totalEarned: number;
  referralCode: string;
  referredBy: string;
  uplinePhones: string[];
  walletMethod: '' | PaymentMethod;
  walletNumber: string;
  blocked: boolean;
  telegramBonusClaimed: boolean;
  lastSpinAt: string;
  createdAt: string;
}

export interface Deposit {
  id: string;
  memberId: string;
  memberPhone: string;
  amount: number;
  method: PaymentMethod;
  targetNumber: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  id: string;
  memberId: string;
  memberPhone: string;
  amount: number;
  method: PaymentMethod;
  walletNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  memberId: string;
  memberPhone: string;
  planId: string;
  planName: string;
  price: number;
  dailyIncome: number;
  cycleDays: number;
  daysClaimed: number;
  lastClaimedAt: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export type TransactionType =
  | 'signup_bonus'
  | 'telegram_bonus'
  | 'deposit'
  | 'withdraw'
  | 'plan_buy'
  | 'daily_income'
  | 'referral_commission'
  | 'admin_adjust'
  | 'spin_bonus';

export interface Transaction {
  id: string;
  memberId: string;
  memberPhone: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
}

export interface LivePayment {
  id: string;
  maskedPhone: string;
  amount: number;
  method: PaymentMethod;
  type: 'deposit' | 'withdraw';
  createdAt: string;
}

export type TabKey =
  | 'home'
  | 'team'
  | 'invite'
  | 'download'
  | 'my'
  | 'recharge'
  | 'withdraw'
  | 'records'
  | 'products'
  | 'wallet_settings'
  | 'company';
