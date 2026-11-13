import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  DEFAULT_APP_CONFIG,
  SEED_LIVE_PAYMENTS,
  maskPhone,
} from './defaults';
import {
  OperationType,
  db,
  handleFirestoreError,
  testFirestoreConnection,
} from './firebase';
import type {
  AppConfig,
  Deposit,
  Investment,
  LivePayment,
  Member,
  PaymentMethod,
  Transaction,
  Withdrawal,
} from '../types';

export async function hashSecret(input: string): Promise<string> {
  const salted = `fdx2026:${input}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(salted);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h = 2166136261;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fb_${(h >>> 0).toString(16)}`;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeNumericMemberId(): string {
  const rand = Math.floor(100000 + Math.random() * 899999);
  return `041${rand}`;
}

let initPromise: Promise<void> | null = null;

export function ensureCloudInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await testFirestoreConnection();

    // 1. Seed or migrate initial placeholder recharge numbers in app_config/public
    const configRef = doc(db, 'app_config', 'public');
    try {
      const configSnap = await getDoc(configRef);
      if (!configSnap.exists()) {
        await setDoc(configRef, DEFAULT_APP_CONFIG);
      } else {
        const existingCfg = configSnap.data() as AppConfig;
        const rn = existingCfg.rechargeNumbers;
        if (
          rn &&
          rn.bkash === '01711000101' &&
          rn.nagad === '01811000202' &&
          rn.rocket === '01911000303'
        ) {
          await updateDoc(configRef, {
            rechargeNumbers: DEFAULT_APP_CONFIG.rechargeNumbers,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Config seed skipped or failed:', err);
    }

    // 2. Seed admin_credentials/main if missing
    const adminRef = doc(db, 'admin_credentials', 'main');
    try {
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        const passHash = await hashSecret('Admin@7860');
        await setDoc(adminRef, {
          username: 'feedexadmin',
          passHash,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Admin cred seed skipped or failed:', err);
    }

    // 3. Seed demo member 01712345678 if missing
    const demoRef = doc(db, 'members', '01712345678');
    try {
      const demoSnap = await getDoc(demoRef);
      if (!demoSnap.exists()) {
        const demoPassHash = await hashSecret('123456');
        const demoMember: Member = {
          id: '041731786',
          phone: '01712345678',
          passwordHash: demoPassHash,
          withdrawPasswordHash: demoPassHash,
          balance: 500,
          totalRecharge: 300,
          totalWithdraw: 0,
          totalEarned: 200,
          referralCode: 'FDX731786',
          referredBy: '',
          uplinePhones: [],
          walletMethod: 'bkash',
          walletNumber: '01712345678',
          blocked: false,
          telegramBonusClaimed: false,
          lastSpinAt: '',
          createdAt: '2026-11-01T10:00:00.000Z',
        };
        await setDoc(demoRef, demoMember);
        const demoTx: Transaction = {
          id: 'tx_demo_signup',
          memberId: demoMember.id,
          memberPhone: demoMember.phone,
          type: 'signup_bonus',
          amount: 150,
          description: 'নতুন অ্যাকাউন্ট নিবন্ধন বোনাস',
          createdAt: '2026-11-01T10:00:00.000Z',
        };
        await setDoc(doc(db, 'transactions', demoTx.id), demoTx);
      }
    } catch (err) {
      console.warn('Demo member seed skipped or failed:', err);
    }

    // 4. Seed live_payments if empty
    try {
      const lpSnap = await getDocs(query(collection(db, 'live_payments'), limit(1)));
      if (lpSnap.empty) {
        for (const item of SEED_LIVE_PAYMENTS) {
          await setDoc(doc(db, 'live_payments', item.id), item);
        }
      }
    } catch (err) {
      console.warn('Live payments seed skipped or failed:', err);
    }
  })();

  return initPromise;
}

export function subscribeAppConfig(onData: (cfg: AppConfig) => void): Unsubscribe {
  const ref = doc(db, 'app_config', 'public');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as AppConfig);
      } else {
        onData(DEFAULT_APP_CONFIG);
      }
    },
    (error) => {
      console.error('app_config subscription error:', error);
    }
  );
}

export function subscribeLivePayments(onData: (items: LivePayment[]) => void): Unsubscribe {
  const q = query(collection(db, 'live_payments'), orderBy('createdAt', 'desc'), limit(25));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as LivePayment);
      onData(items.length > 0 ? items : SEED_LIVE_PAYMENTS);
    },
    (error) => {
      console.error('live_payments subscription error:', error);
      onData(SEED_LIVE_PAYMENTS);
    }
  );
}

export function subscribeMember(
  phone: string,
  onData: (member: Member | null) => void
): Unsubscribe {
  const ref = doc(db, 'members', phone);
  return onSnapshot(
    ref,
    (snap) => {
      onData(snap.exists() ? (snap.data() as Member) : null);
    },
    (error) => handleFirestoreError(error, OperationType.GET, `members/${phone}`)
  );
}

export function subscribeMemberDeposits(
  phone: string,
  onData: (items: Deposit[]) => void
): Unsubscribe {
  const q = query(collection(db, 'deposits'), where('memberPhone', '==', phone));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as Deposit)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'deposits')
  );
}

export function subscribeMemberWithdrawals(
  phone: string,
  onData: (items: Withdrawal[]) => void
): Unsubscribe {
  const q = query(collection(db, 'withdrawals'), where('memberPhone', '==', phone));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as Withdrawal)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'withdrawals')
  );
}

export function subscribeMemberInvestments(
  phone: string,
  onData: (items: Investment[]) => void
): Unsubscribe {
  const q = query(collection(db, 'investments'), where('memberPhone', '==', phone));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as Investment)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'investments')
  );
}

export function subscribeMemberTransactions(
  phone: string,
  onData: (items: Transaction[]) => void
): Unsubscribe {
  const q = query(collection(db, 'transactions'), where('memberPhone', '==', phone));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as Transaction)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'transactions')
  );
}

export async function registerMember(
  rawPhone: string,
  password: string,
  referralCodeInput: string
): Promise<Member> {
  await ensureCloudInitialized();
  const phone = rawPhone.replace(/\D/g, '');
  if (!/^01[3-9]\d{8}$/.test(phone)) {
    throw new Error('সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
  }
  if (password.length < 6) {
    throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
  }

  const memberRef = doc(db, 'members', phone);
  const existing = await getDoc(memberRef);
  if (existing.exists()) {
    throw new Error('এই মোবাইল নম্বর দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে।');
  }

  const cfgSnap = await getDoc(doc(db, 'app_config', 'public'));
  const cfg = cfgSnap.exists() ? (cfgSnap.data() as AppConfig) : DEFAULT_APP_CONFIG;

  let uplinePhones: string[] = [];
  const trimmedRef = referralCodeInput.trim().toUpperCase();
  if (trimmedRef) {
    const refQuery = query(
      collection(db, 'members'),
      where('referralCode', '==', trimmedRef),
      limit(1)
    );
    const refSnap = await getDocs(refQuery);
    if (!refSnap.empty) {
      const upline = refSnap.docs[0].data() as Member;
      uplinePhones = [upline.phone, ...(upline.uplinePhones || [])].slice(0, 3);
    }
  }

  const now = new Date().toISOString();
  const passHash = await hashSecret(password);
  const id = makeNumericMemberId();
  const member: Member = {
    id,
    phone,
    passwordHash: passHash,
    withdrawPasswordHash: passHash,
    balance: Number(cfg.signupBonus ?? 150),
    totalRecharge: 0,
    totalWithdraw: 0,
    totalEarned: 0,
    referralCode: `FDX${id.slice(-6)}`,
    referredBy: trimmedRef,
    uplinePhones,
    walletMethod: '',
    walletNumber: '',
    blocked: false,
    telegramBonusClaimed: false,
    lastSpinAt: '',
    createdAt: now,
  };

  try {
    await setDoc(memberRef, member);
    const tx: Transaction = {
      id: makeId('tx'),
      memberId: member.id,
      memberPhone: member.phone,
      type: 'signup_bonus',
      amount: member.balance,
      description: `নতুন নিবন্ধন বোনাস (${member.balance} টাকা)`,
      createdAt: now,
    };
    await setDoc(doc(db, 'transactions', tx.id), tx);
    return member;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `members/${phone}`);
  }
}

export async function loginMember(rawPhone: string, password: string): Promise<Member> {
  await ensureCloudInitialized();
  const phone = rawPhone.replace(/\D/g, '');
  if (!phone || !password) {
    throw new Error('মোবাইল নম্বর এবং পাসওয়ার্ড দিন।');
  }
  const ref = doc(db, 'members', phone);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('এই নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
  }
  const member = snap.data() as Member;
  if (member.blocked) {
    throw new Error('আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে। সাপোর্টে যোগাযোগ করুন।');
  }
  const passHash = await hashSecret(password);
  if (member.passwordHash !== passHash) {
    throw new Error('পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।');
  }
  return member;
}

export async function submitDeposit(
  phone: string,
  amount: number,
  method: PaymentMethod,
  trxId: string
): Promise<void> {
  const cfgSnap = await getDoc(doc(db, 'app_config', 'public'));
  const cfg = cfgSnap.exists() ? (cfgSnap.data() as AppConfig) : DEFAULT_APP_CONFIG;

  if (amount < cfg.minDeposit) {
    throw new Error(`সর্বনিম্ন ডিপোজিট পরিমাণ ৳ ${cfg.minDeposit}।`);
  }
  const cleanTrx = trxId.trim().toUpperCase();
  if (cleanTrx.length < 6) {
    throw new Error('সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন।');
  }

  const dupQuery = query(collection(db, 'deposits'), where('trxId', '==', cleanTrx), limit(1));
  const dupSnap = await getDocs(dupQuery);
  if (!dupSnap.empty) {
    throw new Error('এই ট্রানজেকশন আইডি আগেই ব্যবহার করা হয়েছে।');
  }

  const memberSnap = await getDoc(doc(db, 'members', phone));
  if (!memberSnap.exists()) throw new Error('সদস্য অ্যাকাউন্ট পাওয়া যায়নি।');
  const member = memberSnap.data() as Member;
  if (member.blocked) throw new Error('অ্যাকাউন্ট স্থগিত রয়েছে।');

  const now = new Date().toISOString();
  const targetNumber = cfg.rechargeNumbers[method];
  const deposit: Deposit = {
    id: makeId('dep'),
    memberId: member.id,
    memberPhone: member.phone,
    amount,
    method,
    targetNumber,
    trxId: cleanTrx,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'deposits', deposit.id), deposit);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `deposits/${deposit.id}`);
  }
}

export async function buyPlan(phone: string, planId: string): Promise<void> {
  const cfgSnap = await getDoc(doc(db, 'app_config', 'public'));
  const cfg = cfgSnap.exists() ? (cfgSnap.data() as AppConfig) : DEFAULT_APP_CONFIG;
  const plan = cfg.plans.find((p) => p.id === planId);
  if (!plan) throw new Error('প্ল্যান খুঁজে পাওয়া যায়নি।');

  try {
    await runTransaction(db, async (tx) => {
      const mRef = doc(db, 'members', phone);
      const mSnap = await tx.get(mRef);
      if (!mSnap.exists()) throw new Error('অ্যাকাউন্ট পাওয়া যায়নি।');
      const m = mSnap.data() as Member;
      if (m.blocked) throw new Error('আপনার অ্যাকাউন্ট স্থগিত আছে।');

      // Mandatory Deposit Gate
      if (m.totalRecharge <= 0) {
        throw new Error(
          'ডিপোজিট ছাড়া কোনো প্ল্যান কেনা যাবে না। অনুগ্রহ করে প্রথমে বিকাশ, নগদ বা রকেট দিয়ে ডিপোজিট করুন।'
        );
      }

      if (m.balance < plan.price) {
        throw new Error('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই। অনুগ্রহ করে রিচার্জ করুন।');
      }

      const now = new Date().toISOString();
      const inv: Investment = {
        id: makeId('inv'),
        memberId: m.id,
        memberPhone: m.phone,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        dailyIncome: plan.dailyIncome,
        cycleDays: plan.cycleDays,
        daysClaimed: 0,
        lastClaimedAt: '',
        status: 'active',
        createdAt: now,
      };
      const ledger: Transaction = {
        id: makeId('tx'),
        memberId: m.id,
        memberPhone: m.phone,
        type: 'plan_buy',
        amount: -plan.price,
        description: `${plan.name} ক্রয়`,
        createdAt: now,
      };

      tx.update(mRef, { balance: Number((m.balance - plan.price).toFixed(2)) });
      tx.set(doc(db, 'investments', inv.id), inv);
      tx.set(doc(db, 'transactions', ledger.id), ledger);
    });
  } catch (err) {
    if (err instanceof Error) throw err;
    handleFirestoreError(err, OperationType.WRITE, `members/${phone}`);
  }
}

export async function claimDailyIncome(phone: string, investmentId: string): Promise<number> {
  let claimedAmount = 0;
  await runTransaction(db, async (tx) => {
    const mRef = doc(db, 'members', phone);
    const invRef = doc(db, 'investments', investmentId);
    const [mSnap, invSnap] = await Promise.all([tx.get(mRef), tx.get(invRef)]);
    if (!mSnap.exists() || !invSnap.exists()) throw new Error('তথ্য পাওয়া যায়নি।');

    const m = mSnap.data() as Member;
    const inv = invSnap.data() as Investment;
    if (inv.memberPhone !== phone) throw new Error('অনুমতি নেই।');
    if (inv.status !== 'active' || inv.daysClaimed >= inv.cycleDays) {
      throw new Error('এই প্ল্যানের মেয়াদ পূর্ণ হয়েছে।');
    }

    if (inv.lastClaimedAt) {
      const elapsedMs = Date.now() - new Date(inv.lastClaimedAt).getTime();
      if (elapsedMs < 24 * 60 * 60 * 1000) {
        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - elapsedMs) / (60 * 60 * 1000));
        throw new Error(`দৈনিক আয় ২৪ ঘণ্টায় একবার নেওয়া যায়। আর প্রায় ${hoursLeft} ঘণ্টা পর সংগ্রহ করুন।`);
      }
    }

    const now = new Date().toISOString();
    const nextDays = inv.daysClaimed + 1;
    const nextStatus: 'active' | 'completed' =
      nextDays >= inv.cycleDays ? 'completed' : 'active';
    claimedAmount = inv.dailyIncome;

    tx.update(invRef, {
      daysClaimed: nextDays,
      lastClaimedAt: now,
      status: nextStatus,
    });
    tx.update(mRef, {
      balance: Number((m.balance + inv.dailyIncome).toFixed(2)),
      totalEarned: Number((m.totalEarned + inv.dailyIncome).toFixed(2)),
    });
    const ledger: Transaction = {
      id: makeId('tx'),
      memberId: m.id,
      memberPhone: m.phone,
      type: 'daily_income',
      amount: inv.dailyIncome,
      description: `${inv.planName} দৈনিক আয় (${nextDays}/${inv.cycleDays} দিন)`,
      createdAt: now,
    };
    tx.set(doc(db, 'transactions', ledger.id), ledger);
  });
  return claimedAmount;
}

export async function claimTelegramBonus(phone: string): Promise<number> {
  const cfgSnap = await getDoc(doc(db, 'app_config', 'public'));
  const cfg = cfgSnap.exists() ? (cfgSnap.data() as AppConfig) : DEFAULT_APP_CONFIG;
  const bonus = Number(cfg.telegramBonus ?? 50);

  await runTransaction(db, async (tx) => {
    const mRef = doc(db, 'members', phone);
    const mSnap = await tx.get(mRef);
    if (!mSnap.exists()) throw new Error('অ্যাকাউন্ট পাওয়া যায়নি।');
    const m = mSnap.data() as Member;
    if (m.telegramBonusClaimed) {
      throw new Error('আপনি ইতিমধ্যে টেলিগ্রাম বোনাস সংগ্রহ করেছেন।');
    }

    const now = new Date().toISOString();
    tx.update(mRef, {
      balance: Number((m.balance + bonus).toFixed(2)),
      totalEarned: Number((m.totalEarned + bonus).toFixed(2)),
      telegramBonusClaimed: true,
    });
    const ledger: Transaction = {
      id: makeId('tx'),
      memberId: m.id,
      memberPhone: m.phone,
      type: 'telegram_bonus',
      amount: bonus,
      description: `টেলিগ্রাম জয়েন বোনাস (${bonus} টাকা)`,
      createdAt: now,
    };
    tx.set(doc(db, 'transactions', ledger.id), ledger);
  });
  return bonus;
}

export async function spinLuckyWheel(phone: string): Promise<number> {
  const prizes = [5, 10, 15, 20, 30, 50];
  const won = prizes[Math.floor(Math.random() * prizes.length)];

  await runTransaction(db, async (tx) => {
    const mRef = doc(db, 'members', phone);
    const mSnap = await tx.get(mRef);
    if (!mSnap.exists()) throw new Error('অ্যাকাউন্ট পাওয়া যায়নি।');
    const m = mSnap.data() as Member;

    if (m.lastSpinAt) {
      const elapsed = Date.now() - new Date(m.lastSpinAt).getTime();
      if (elapsed < 24 * 60 * 60 * 1000) {
        throw new Error('দৈনিক লাকি স্পিন ২৪ ঘণ্টায় একবার ব্যবহার করা যায়।');
      }
    }

    const now = new Date().toISOString();
    tx.update(mRef, {
      balance: Number((m.balance + won).toFixed(2)),
      totalEarned: Number((m.totalEarned + won).toFixed(2)),
      lastSpinAt: now,
    });
    const ledger: Transaction = {
      id: makeId('tx'),
      memberId: m.id,
      memberPhone: m.phone,
      type: 'spin_bonus',
      amount: won,
      description: `লাকি স্পিন পুরস্কার (৳ ${won})`,
      createdAt: now,
    };
    tx.set(doc(db, 'transactions', ledger.id), ledger);
  });
  return won;
}

export async function updateWalletSettings(
  phone: string,
  walletMethod: PaymentMethod,
  walletNumber: string,
  newWithdrawPassword?: string
): Promise<void> {
  const cleanNum = walletNumber.replace(/\D/g, '');
  if (!/^01[3-9]\d{8}$/.test(cleanNum)) {
    throw new Error('সঠিক ১১ সংখ্যার মোবাইল ওয়ালেট নম্বর দিন।');
  }
  const updates: Partial<Member> = {
    walletMethod,
    walletNumber: cleanNum,
  };
  if (newWithdrawPassword && newWithdrawPassword.trim().length >= 4) {
    updates.withdrawPasswordHash = await hashSecret(newWithdrawPassword.trim());
  }
  await updateDoc(doc(db, 'members', phone), updates);
}

export async function updateLoginPassword(
  phone: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
  }
  const mRef = doc(db, 'members', phone);
  const mSnap = await getDoc(mRef);
  if (!mSnap.exists()) throw new Error('অ্যাকাউন্ট পাওয়া যায়নি।');
  const m = mSnap.data() as Member;
  const oldHash = await hashSecret(oldPassword);
  if (m.passwordHash !== oldHash) {
    throw new Error('বর্তমান পাসওয়ার্ড সঠিক নয়।');
  }
  const newHash = await hashSecret(newPassword);
  await updateDoc(mRef, { passwordHash: newHash });
}

export async function submitWithdrawal(
  phone: string,
  amount: number,
  withdrawPassword: string
): Promise<void> {
  const cfgSnap = await getDoc(doc(db, 'app_config', 'public'));
  const cfg = cfgSnap.exists() ? (cfgSnap.data() as AppConfig) : DEFAULT_APP_CONFIG;

  const passHash = await hashSecret(withdrawPassword.trim());

  await runTransaction(db, async (tx) => {
    const mRef = doc(db, 'members', phone);
    const mSnap = await tx.get(mRef);
    if (!mSnap.exists()) throw new Error('অ্যাকাউন্ট পাওয়া যায়নি।');
    const m = mSnap.data() as Member;
    if (m.blocked) throw new Error('আপনার অ্যাকাউন্ট স্থগিত আছে।');

    // Mandatory Deposit Gate
    if (m.totalRecharge <= 0) {
      throw new Error(
        'ডিপোজিট ছাড়া উত্তোলন করা যাবে না। অনুগ্রহ করে প্রথমে বিকাশ, নগদ বা রকেট দিয়ে ডিপোজিট করুন।'
      );
    }

    if (!m.walletMethod || !m.walletNumber) {
      throw new Error('প্রথমে বিকাশ, নগদ বা রকেট ওয়ালেট নম্বর যুক্ত করুন।');
    }

    if (m.withdrawPasswordHash !== passHash && m.passwordHash !== passHash) {
      throw new Error('উত্তোলন পাসওয়ার্ড সঠিক নয়।');
    }

    if (amount < cfg.minWithdraw) {
      throw new Error(`সর্বনিম্ন উত্তোলন পরিমাণ ৳ ${cfg.minWithdraw}।`);
    }

    if (m.balance < amount) {
      throw new Error('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।');
    }

    const now = new Date().toISOString();
    const wd: Withdrawal = {
      id: makeId('wd'),
      memberId: m.id,
      memberPhone: m.phone,
      amount,
      method: m.walletMethod,
      walletNumber: m.walletNumber,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    const ledger: Transaction = {
      id: makeId('tx'),
      memberId: m.id,
      memberPhone: m.phone,
      type: 'withdraw',
      amount: -amount,
      description: `${m.walletMethod.toUpperCase()} উত্তোলন আবেদন (${m.walletNumber})`,
      createdAt: now,
    };

    tx.update(mRef, { balance: Number((m.balance - amount).toFixed(2)) });
    tx.set(doc(db, 'withdrawals', wd.id), wd);
    tx.set(doc(db, 'transactions', ledger.id), ledger);
  });
}

export interface TeamHierarchyData {
  level1: Member[];
  level2: Member[];
  level3: Member[];
  totalTeamRecharge: number;
  totalTeamCount: number;
  totalCommissionEarned: number;
}

export async function fetchTeamHierarchy(phone: string): Promise<TeamHierarchyData> {
  const q = query(collection(db, 'members'), where('uplinePhones', 'array-contains', phone));
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => d.data() as Member);

  const level1 = all.filter((m) => m.uplinePhones?.[0] === phone);
  const level2 = all.filter((m) => m.uplinePhones?.[1] === phone);
  const level3 = all.filter((m) => m.uplinePhones?.[2] === phone);

  const txQ = query(collection(db, 'transactions'), where('memberPhone', '==', phone));
  const txSnap = await getDocs(txQ);
  const totalCommissionEarned = txSnap.docs
    .map((d) => d.data() as Transaction)
    .filter((t) => t.type === 'referral_commission')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTeamRecharge = all.reduce((sum, m) => sum + (m.totalRecharge || 0), 0);

  return {
    level1,
    level2,
    level3,
    totalTeamRecharge,
    totalTeamCount: all.length,
    totalCommissionEarned,
  };
}

// ==================== ADMIN REAL-TIME & ACTIONS ====================

export async function verifyAdminLogin(username: string, password: string): Promise<boolean> {
  await ensureCloudInitialized();
  const snap = await getDoc(doc(db, 'admin_credentials', 'main'));
  if (!snap.exists()) return false;
  const creds = snap.data() as { username: string; passHash: string };
  const passHash = await hashSecret(password);
  return creds.username === username.trim() && creds.passHash === passHash;
}

export async function updateAdminCredentials(
  currentPassword: string,
  newUsername: string,
  newPassword: string
): Promise<void> {
  const ref = doc(db, 'admin_credentials', 'main');
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('এডমিন তথ্য পাওয়া যায়নি।');
  const creds = snap.data() as { username: string; passHash: string };
  const curHash = await hashSecret(currentPassword);
  if (creds.passHash !== curHash) {
    throw new Error('বর্তমান এডমিন পাসওয়ার্ড সঠিক নয়।');
  }
  if (newUsername.trim().length < 4 || newPassword.length < 6) {
    throw new Error('ইউজারনেম কমপক্ষে ৪ অক্ষর ও নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
  }
  await setDoc(ref, {
    username: newUsername.trim(),
    passHash: await hashSecret(newPassword),
    updatedAt: new Date().toISOString(),
  });
}

export function subscribeAllMembers(onData: (items: Member[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'members'), (snap) => {
    const items = snap.docs
      .map((d) => d.data() as Member)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    onData(items);
  });
}

export function subscribeAllDeposits(onData: (items: Deposit[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'deposits'), (snap) => {
    const items = snap.docs
      .map((d) => d.data() as Deposit)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    onData(items);
  });
}

export function subscribeAllWithdrawals(onData: (items: Withdrawal[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'withdrawals'), (snap) => {
    const items = snap.docs
      .map((d) => d.data() as Withdrawal)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    onData(items);
  });
}

export async function adminSaveAppConfig(nextConfig: AppConfig): Promise<void> {
  const payload: AppConfig = {
    ...nextConfig,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'app_config', 'public'), payload);
}

export async function adminAdjustBalance(
  phone: string,
  delta: number,
  note: string
): Promise<void> {
  if (!delta || Number.isNaN(delta)) throw new Error('সঠিক পরিমাণ লিখুন।');

  await runTransaction(db, async (tx) => {
    const mRef = doc(db, 'members', phone);
    const mSnap = await tx.get(mRef);
    if (!mSnap.exists()) throw new Error('সদস্য পাওয়া যায়নি।');
    const m = mSnap.data() as Member;
    const nextBalance = Math.max(0, Number((m.balance + delta).toFixed(2)));
    const now = new Date().toISOString();

    tx.update(mRef, { balance: nextBalance });
    const ledger: Transaction = {
      id: makeId('tx'),
      memberId: m.id,
      memberPhone: m.phone,
      type: 'admin_adjust',
      amount: delta,
      description: note.trim() || (delta > 0 ? 'এডমিন ব্যালেন্স যোগ' : 'এডমিন ব্যালেন্স কর্তন'),
      createdAt: now,
    };
    tx.set(doc(db, 'transactions', ledger.id), ledger);
  });
}

export async function adminToggleMemberBlock(phone: string, blocked: boolean): Promise<void> {
  await updateDoc(doc(db, 'members', phone), { blocked });
}

export async function adminApproveDeposit(depositId: string): Promise<void> {
  const cfgSnap = await getDoc(doc(db, 'app_config', 'public'));
  const cfg = cfgSnap.exists() ? (cfgSnap.data() as AppConfig) : DEFAULT_APP_CONFIG;

  const depSnap = await getDoc(doc(db, 'deposits', depositId));
  if (!depSnap.exists()) throw new Error('ডিপোজিট পাওয়া যায়নি।');
  const dep = depSnap.data() as Deposit;
  if (dep.status !== 'pending') throw new Error('এই ডিপোজিট আগেই প্রক্রিয়া করা হয়েছে।');

  const now = new Date().toISOString();
  const memberSnap = await getDoc(doc(db, 'members', dep.memberPhone));
  if (!memberSnap.exists()) throw new Error('সদস্য অ্যাকাউন্ট পাওয়া যায়নি।');
  const member = memberSnap.data() as Member;

  await updateDoc(doc(db, 'deposits', depositId), {
    status: 'approved',
    updatedAt: now,
  });

  await updateDoc(doc(db, 'members', member.phone), {
    balance: Number((member.balance + dep.amount).toFixed(2)),
    totalRecharge: Number((member.totalRecharge + dep.amount).toFixed(2)),
  });

  const depTx: Transaction = {
    id: makeId('tx'),
    memberId: member.id,
    memberPhone: member.phone,
    type: 'deposit',
    amount: dep.amount,
    description: `${dep.method.toUpperCase()} ডিপোজিট অনুমোদিত (TrxID: ${dep.trxId})`,
    createdAt: now,
  };
  await setDoc(doc(db, 'transactions', depTx.id), depTx);

  // Push to live payments feed for all users
  const lp: LivePayment = {
    id: makeId('lp'),
    maskedPhone: maskPhone(member.phone),
    amount: dep.amount,
    method: dep.method,
    type: 'deposit',
    createdAt: now,
  };
  await setDoc(doc(db, 'live_payments', lp.id), lp);

  // Automatic 3-level referral commissions
  const rates = [
    cfg.referralRates.level1,
    cfg.referralRates.level2,
    cfg.referralRates.level3,
  ];
  const uplines = member.uplinePhones || [];
  for (let i = 0; i < Math.min(3, uplines.length); i++) {
    const upPhone = uplines[i];
    const rate = rates[i] || 0;
    if (!upPhone || rate <= 0) continue;

    const commission = Number(((dep.amount * rate) / 100).toFixed(2));
    if (commission <= 0) continue;

    const upRef = doc(db, 'members', upPhone);
    const upSnap = await getDoc(upRef);
    if (!upSnap.exists()) continue;
    const up = upSnap.data() as Member;

    await updateDoc(upRef, {
      balance: Number((up.balance + commission).toFixed(2)),
      totalEarned: Number((up.totalEarned + commission).toFixed(2)),
    });

    const commTx: Transaction = {
      id: makeId('tx'),
      memberId: up.id,
      memberPhone: up.phone,
      type: 'referral_commission',
      amount: commission,
      description: `লেভেল ${i + 1} রেফার কমিশন (${rate}%) - ${maskPhone(member.phone)}`,
      createdAt: now,
    };
    await setDoc(doc(db, 'transactions', commTx.id), commTx);
  }
}

export async function adminRejectDeposit(depositId: string): Promise<void> {
  const depRef = doc(db, 'deposits', depositId);
  const depSnap = await getDoc(depRef);
  if (!depSnap.exists()) throw new Error('ডিপোজিট পাওয়া যায়নি।');
  const dep = depSnap.data() as Deposit;
  if (dep.status !== 'pending') throw new Error('এই ডিপোজিট আগেই প্রক্রিয়া করা হয়েছে।');

  await updateDoc(depRef, {
    status: 'rejected',
    updatedAt: new Date().toISOString(),
  });
}

export async function adminApproveWithdrawal(withdrawalId: string): Promise<void> {
  const wdRef = doc(db, 'withdrawals', withdrawalId);
  const wdSnap = await getDoc(wdRef);
  if (!wdSnap.exists()) throw new Error('উত্তোলন পাওয়া যায়নি।');
  const wd = wdSnap.data() as Withdrawal;
  if (wd.status !== 'pending') throw new Error('এই উত্তোলন আগেই প্রক্রিয়া করা হয়েছে।');

  const now = new Date().toISOString();
  await updateDoc(wdRef, { status: 'approved', updatedAt: now });

  const mRef = doc(db, 'members', wd.memberPhone);
  const mSnap = await getDoc(mRef);
  if (mSnap.exists()) {
    const m = mSnap.data() as Member;
    await updateDoc(mRef, {
      totalWithdraw: Number((m.totalWithdraw + wd.amount).toFixed(2)),
    });
  }

  const lp: LivePayment = {
    id: makeId('lp'),
    maskedPhone: maskPhone(wd.memberPhone),
    amount: wd.amount,
    method: wd.method,
    type: 'withdraw',
    createdAt: now,
  };
  await setDoc(doc(db, 'live_payments', lp.id), lp);
}

export async function adminRejectWithdrawal(withdrawalId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const wdRef = doc(db, 'withdrawals', withdrawalId);
    const wdSnap = await tx.get(wdRef);
    if (!wdSnap.exists()) throw new Error('উত্তোলন পাওয়া যায়নি।');
    const wd = wdSnap.data() as Withdrawal;
    if (wd.status !== 'pending') throw new Error('এই উত্তোলন আগেই প্রক্রিয়া করা হয়েছে।');

    const mRef = doc(db, 'members', wd.memberPhone);
    const mSnap = await tx.get(mRef);
    const now = new Date().toISOString();

    tx.update(wdRef, { status: 'rejected', updatedAt: now });
    if (mSnap.exists()) {
      const m = mSnap.data() as Member;
      tx.update(mRef, {
        balance: Number((m.balance + wd.amount).toFixed(2)),
      });
      const refundTx: Transaction = {
        id: makeId('tx'),
        memberId: m.id,
        memberPhone: m.phone,
        type: 'admin_adjust',
        amount: wd.amount,
        description: 'উত্তোলন বাতিল হওয়ায় ব্যালেন্স ফেরত',
        createdAt: now,
      };
      tx.set(doc(db, 'transactions', refundTx.id), refundTx);
    }
  });
}
