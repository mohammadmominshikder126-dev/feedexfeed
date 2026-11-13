import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  GitBranch,
  KeyRound,
  Lock,
  LogOut,
  MinusCircle,
  Package,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { BRAND_ASSETS } from '../lib/assets';
import { METHOD_LABELS, formatBDT } from '../lib/defaults';
import {
  adminAdjustBalance,
  adminApproveDeposit,
  adminApproveWithdrawal,
  adminRejectDeposit,
  adminRejectWithdrawal,
  adminSaveAppConfig,
  adminToggleMemberBlock,
  subscribeAllDeposits,
  subscribeAllMembers,
  subscribeAllWithdrawals,
  updateAdminCredentials,
  verifyAdminLogin,
} from '../lib/storeService';
import type { AppConfig, Deposit, Member, PlanItem, Withdrawal } from '../types';

interface AdminPanelViewProps {
  config: AppConfig;
  onExitAdmin: () => void;
}

type AdminTab =
  | 'members'
  | 'deposits'
  | 'withdrawals'
  | 'settings'
  | 'plans'
  | 'security';

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  config,
  onExitAdmin,
}) => {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('fdx_admin_authed') === '1';
    } catch {
      return false;
    }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<AdminTab>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberPhone, setSelectedMemberPhone] = useState<string | null>(
    null
  );

  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [draftConfig, setDraftConfig] = useState<AppConfig>(config);
  const [draftPlans, setDraftPlans] = useState<PlanItem[]>(config.plans);

  const [curAdminPass, setCurAdminPass] = useState('');
  const [newAdminUser, setNewAdminUser] = useState('feedexadmin');
  const [newAdminPass, setNewAdminPass] = useState('');

  const [statusMsg, setStatusMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  React.useEffect(() => {
    setDraftConfig(config);
    setDraftPlans(config.plans);
  }, [config]);

  React.useEffect(() => {
    if (!authed) return;
    const unsubM = subscribeAllMembers(setMembers);
    const unsubD = subscribeAllDeposits(setDeposits);
    const unsubW = subscribeAllWithdrawals(setWithdrawals);
    return () => {
      unsubM();
      unsubD();
      unsubW();
    };
  }, [authed]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const ok = await verifyAdminLogin(username, password);
      if (!ok) {
        setLoginError('এডমিন ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।');
      } else {
        sessionStorage.setItem('fdx_admin_authed', '1');
        setAuthed(true);
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogoutAdmin = () => {
    sessionStorage.removeItem('fdx_admin_authed');
    setAuthed(false);
  };

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.phone.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.referralCode.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const selectedMember = useMemo(
    () => members.find((m) => m.phone === selectedMemberPhone) || null,
    [members, selectedMemberPhone]
  );

  const selectedFamily = useMemo(() => {
    if (!selectedMember) return null;
    const l1 = members.filter((m) => m.uplinePhones?.[0] === selectedMember.phone);
    const l2 = members.filter((m) => m.uplinePhones?.[1] === selectedMember.phone);
    const l3 = members.filter((m) => m.uplinePhones?.[2] === selectedMember.phone);
    return { l1, l2, l3 };
  }, [members, selectedMember]);

  const pendingDepositsCount = deposits.filter((d) => d.status === 'pending').length;
  const pendingWithdrawalsCount = withdrawals.filter(
    (w) => w.status === 'pending'
  ).length;
  const totalApprovedDepositAmount = deposits
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);

  const handleAdjust = async (sign: 1 | -1) => {
    if (!selectedMember) return;
    const val = Math.abs(Number(adjustAmount));
    if (!val || Number.isNaN(val)) {
      setStatusMsg({ type: 'err', text: 'সঠিক টাকার পরিমাণ লিখুন।' });
      return;
    }
    try {
      await adminAdjustBalance(selectedMember.phone, sign * val, adjustNote);
      setAdjustAmount('');
      setAdjustNote('');
      setStatusMsg({
        type: 'ok',
        text: `${selectedMember.phone} অ্যাকাউন্টে ${formatBDT(val)} ${
          sign > 0 ? 'যোগ' : 'কর্তন'
        } করা হয়েছে।`,
      });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'ব্যর্থ হয়েছে।',
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      await adminSaveAppConfig({
        ...draftConfig,
        plans: draftPlans,
      });
      setStatusMsg({
        type: 'ok',
        text: 'রিচার্জ নম্বর ও সকল সিস্টেম সেটিংস সংরক্ষিত হয়েছে এবং সব ইউজারের কাছে আপডেট হয়েছে!',
      });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ হয়েছে।',
      });
    }
  };

  const handleSavePlans = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      const normalized = draftPlans.map((p) => ({
        ...p,
        price: Number(p.price),
        dailyIncome: Number(p.dailyIncome),
        cycleDays: Number(p.cycleDays),
        totalReturn: Number(p.dailyIncome) * Number(p.cycleDays),
      }));
      await adminSaveAppConfig({
        ...draftConfig,
        plans: normalized,
      });
      setStatusMsg({
        type: 'ok',
        text: 'সকল প্ল্যানের দাম ও দৈনিক আয় আপডেট হয়েছে!',
      });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'আপডেট ব্যর্থ হয়েছে।',
      });
    }
  };

  const handleUpdateAdminCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      await updateAdminCredentials(curAdminPass, newAdminUser, newAdminPass);
      setCurAdminPass('');
      setNewAdminPass('');
      setStatusMsg({
        type: 'ok',
        text: 'এডমিন ইউজারনেম ও পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।',
      });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'পরিবর্তন ব্যর্থ হয়েছে।',
      });
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={BRAND_ASSETS.logo}
                alt="Feedex লোগো"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl border border-slate-200 object-cover"
              />
              <div>
                <h1 className="font-bold text-lg text-slate-900">
                  FeedexDigital এডমিন প্যানেল
                </h1>
                <p className="text-xs text-slate-500">
                  সুরক্ষিত নিয়ন্ত্রণ কেন্দ্র
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onExitAdmin}
              className="text-xs font-semibold text-purple-900 hover:underline cursor-pointer"
            >
              মূল সাইট
            </button>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                এডমিন ইউজারনেম
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="feedexadmin"
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                এডমিন পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full min-h-[48px] rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {loggingIn ? 'যাচাই হচ্ছে...' : 'এডমিন লগইন করুন'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-30 bg-purple-950 text-white border-b border-purple-900 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src={BRAND_ASSETS.logo}
              alt="Feedex লোগো"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-lg bg-white p-0.5 object-cover"
            />
            <div>
              <h1 className="font-display font-bold text-base leading-tight">
                FeedexDigital Admin
              </h1>
              <p className="text-[11px] text-orange-300">
                রিয়েল-টাইম ক্লাউড কন্ট্রোল প্যানেল
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExitAdmin}
              className="min-h-[40px] px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              ইউজার সাইট
            </button>
            <button
              type="button"
              onClick={handleLogoutAdmin}
              className="min-h-[40px] px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              লগআউট
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Live KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500">মোট নিবন্ধিত সদস্য</p>
            <p className="text-2xl font-bold font-mono-num text-purple-950 mt-1">
              {members.length} জন
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500">অপেক্ষমাণ ডিপোজিট</p>
            <p className="text-2xl font-bold font-mono-num text-orange-600 mt-1">
              {pendingDepositsCount} টি
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500">অপেক্ষমাণ উত্তোলন</p>
            <p className="text-2xl font-bold font-mono-num text-amber-600 mt-1">
              {pendingWithdrawalsCount} টি
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500">মোট অনুমোদিত ডিপোজিট</p>
            <p className="text-2xl font-bold font-mono-num text-emerald-700 mt-1">
              {formatBDT(totalApprovedDepositAmount)}
            </p>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'members' as const, label: 'সদস্য ও ফ্যামিলি', icon: Users },
            {
              id: 'deposits' as const,
              label: `ডিপোজিট (${pendingDepositsCount})`,
              icon: Wallet,
            },
            {
              id: 'withdrawals' as const,
              label: `উত্তোলন (${pendingWithdrawalsCount})`,
              icon: Wallet,
            },
            {
              id: 'settings' as const,
              label: 'রিচার্জ নম্বর ও লিংক',
              icon: Settings,
            },
            { id: 'plans' as const, label: 'প্ল্যান দাম নিয়ন্ত্রণ', icon: Package },
            { id: 'security' as const, label: 'এডমিন পাসওয়ার্ড', icon: KeyRound },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setStatusMsg(null);
                }}
                className={`min-h-[42px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  tab === item.id
                    ? 'bg-purple-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl border text-sm font-medium ${
              statusMsg.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* TAB 1: MEMBERS & FAMILY TREE */}
        {tab === 'members' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="সদস্যের মোবাইল নম্বর বা অ্যাকাউন্ট আইডি (যেমন: 041731786) দিয়ে খুঁজুন..."
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>

              <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
                {filteredMembers.map((m) => (
                  <button
                    key={m.phone}
                    type="button"
                    onClick={() => setSelectedMemberPhone(m.phone)}
                    className={`w-full py-3 px-3 rounded-xl flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      selectedMemberPhone === m.phone
                        ? 'bg-purple-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold font-mono-num text-sm text-slate-900">
                        {m.phone}{' '}
                        {m.blocked && (
                          <span className="text-xs text-red-600">(ব্লকড)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-mono-num">
                        ID: {m.id} · কোড: {m.referralCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono-num text-sm text-purple-900">
                        {formatBDT(m.balance)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono-num">
                        রিচার্জ: {formatBDT(m.totalRecharge)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Member Control & Family Tree */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              {!selectedMember ? (
                <p className="text-sm text-slate-500 py-12 text-center">
                  বাম তালিকা থেকে যেকোনো সদস্য নির্বাচন করলে তার ব্যালেন্স ও ৩-লেভেল
                  ফ্যামিলি ট্রি নিয়ন্ত্রণ করতে পারবেন।
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="font-bold font-mono-num text-lg text-slate-900">
                        {selectedMember.phone}
                      </h2>
                      <p className="text-xs text-slate-500 font-mono-num">
                        ID: {selectedMember.id} · রেফার কোড:{' '}
                        {selectedMember.referralCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        adminToggleMemberBlock(
                          selectedMember.phone,
                          !selectedMember.blocked
                        )
                      }
                      className={`min-h-[38px] px-3 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        selectedMember.blocked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      {selectedMember.blocked ? 'আনব্লক করুন' : 'ব্লক করুন'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <p className="text-slate-500">ব্যালেন্স</p>
                      <p className="font-bold font-mono-num text-purple-900">
                        {formatBDT(selectedMember.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">রিচার্জ</p>
                      <p className="font-bold font-mono-num">
                        {formatBDT(selectedMember.totalRecharge)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">উত্তোলন</p>
                      <p className="font-bold font-mono-num">
                        {formatBDT(selectedMember.totalWithdraw)}
                      </p>
                    </div>
                  </div>

                  {/* Balance Add / Deduct */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-800">
                      ব্যালেন্স যোগ বা কর্তন করুন
                    </p>
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="টাকার পরিমাণ (যেমন: 500)"
                      className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                    />
                    <input
                      type="text"
                      value={adjustNote}
                      onChange={(e) => setAdjustNote(e.target.value)}
                      placeholder="কারণ / নোট (ঐচ্ছিক)"
                      className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleAdjust(1)}
                        className="min-h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" /> ব্যালেন্স যোগ (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjust(-1)}
                        className="min-h-[42px] rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MinusCircle className="w-4 h-4" /> ব্যালেন্স কর্তন (-)
                      </button>
                    </div>
                  </div>

                  {/* 3-Level Family Tree */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-purple-800" /> ইউজার
                      ফ্যামিলি ট্রি (আপলাইন ও ৩-লেভেল টিম)
                    </p>
                    <div className="text-xs bg-slate-50 p-3 rounded-xl space-y-1.5">
                      <p>
                        <span className="text-slate-500">আপলাইন চেইন:</span>{' '}
                        <span className="font-mono-num font-semibold">
                          {selectedMember.uplinePhones?.length
                            ? selectedMember.uplinePhones.join(' → ')
                            : 'সরাসরি নিবন্ধন'}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-500">১ম লেভেল:</span>{' '}
                        <span className="font-mono-num font-bold">
                          {selectedFamily?.l1.length || 0} জন
                        </span>{' '}
                        ·{' '}
                        <span className="text-slate-500">২য় লেভেল:</span>{' '}
                        <span className="font-mono-num font-bold">
                          {selectedFamily?.l2.length || 0} জন
                        </span>{' '}
                        ·{' '}
                        <span className="text-slate-500">৩য় লেভেল:</span>{' '}
                        <span className="font-mono-num font-bold">
                          {selectedFamily?.l3.length || 0} জন
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DEPOSITS */}
        {tab === 'deposits' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-base text-slate-900 mb-4">
              সকল ডিপোজিট অনুরোধ (বিকাশ / নগদ / রকেট)
            </h2>
            {deposits.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                কোনো ডিপোজিট পাওয়া যায়নি।
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {deposits.map((d) => (
                  <div
                    key={d.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 text-xs sm:text-sm">
                      <p className="font-bold font-mono-num text-slate-900">
                        {d.memberPhone} · {METHOD_LABELS[d.method]} ·{' '}
                        {formatBDT(d.amount)}
                      </p>
                      <p className="text-xs text-slate-500 font-mono-num">
                        TrxID: {d.trxId} · প্রেরিত নম্বর: {d.targetNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => adminApproveDeposit(d.id)}
                            className="min-h-[40px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" /> অনুমোদন
                          </button>
                          <button
                            type="button"
                            onClick={() => adminRejectDeposit(d.id)}
                            className="min-h-[40px] px-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" /> বাতিল
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-xs font-bold ${
                            d.status === 'approved'
                              ? 'text-emerald-700'
                              : 'text-red-600'
                          }`}
                        >
                          {d.status === 'approved' ? 'অনুমোদিত' : 'বাতিল'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WITHDRAWALS */}
        {tab === 'withdrawals' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-base text-slate-900 mb-4">
              সকল উত্তোলন আবেদন
            </h2>
            {withdrawals.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                কোনো উত্তোলন আবেদন পাওয়া যায়নি।
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 text-xs sm:text-sm">
                      <p className="font-bold font-mono-num text-slate-900">
                        {w.memberPhone} · {METHOD_LABELS[w.method]} ·{' '}
                        {formatBDT(w.amount)}
                      </p>
                      <p className="text-xs text-slate-500 font-mono-num">
                        পেমেন্ট নম্বর: {w.walletNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {w.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => adminApproveWithdrawal(w.id)}
                            className="min-h-[40px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" /> পেমেন্ট সম্পন্ন
                          </button>
                          <button
                            type="button"
                            onClick={() => adminRejectWithdrawal(w.id)}
                            className="min-h-[40px] px-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" /> বাতিল ও ফেরত
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-xs font-bold ${
                            w.status === 'approved'
                              ? 'text-emerald-700'
                              : 'text-red-600'
                          }`}
                        >
                          {w.status === 'approved' ? 'সম্পন্ন' : 'বাতিল'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RECHARGE NUMBERS, TELEGRAM, SUPPORT & REFERRAL RATES */}
        {tab === 'settings' && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm"
          >
            <div>
              <h2 className="font-bold text-base text-slate-900">
                রিচার্জ নম্বর ও গ্লোবাল সেটিংস (সব ডোমেইনে লাইভ সিঙ্ক)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                এখান থেকে পরিবর্তন করে সেভ করলেই সাথে সাথে সব ইউজারের ডিপোজিট পেজে
                নতুন নম্বর প্রদর্শিত হবে।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-pink-700 mb-1">
                  বিকাশ (bKash) সেন্ড মানি নম্বর
                </label>
                <input
                  type="text"
                  required
                  value={draftConfig.rechargeNumbers.bkash}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      rechargeNumbers: {
                        ...draftConfig.rechargeNumbers,
                        bkash: e.target.value,
                      },
                    })
                  }
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-700 mb-1">
                  নগদ (Nagad) সেন্ড মানি নম্বর
                </label>
                <input
                  type="text"
                  required
                  value={draftConfig.rechargeNumbers.nagad}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      rechargeNumbers: {
                        ...draftConfig.rechargeNumbers,
                        nagad: e.target.value,
                      },
                    })
                  }
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-purple-800 mb-1">
                  রকেট (Rocket) সেন্ড মানি নম্বর
                </label>
                <input
                  type="text"
                  required
                  value={draftConfig.rechargeNumbers.rocket}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      rechargeNumbers: {
                        ...draftConfig.rechargeNumbers,
                        rocket: e.target.value,
                      },
                    })
                  }
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টেলিগ্রাম গ্রুপ / চ্যানেল লিংক
                </label>
                <input
                  type="url"
                  required
                  value={draftConfig.telegramLink}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      telegramLink: e.target.value,
                    })
                  }
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সাপোর্ট সেন্টার লিংক
                </label>
                <input
                  type="url"
                  required
                  value={draftConfig.supportLink}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      supportLink: e.target.value,
                    })
                  }
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ১ম লেভেল (%)
                </label>
                <input
                  type="number"
                  value={draftConfig.referralRates.level1}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      referralRates: {
                        ...draftConfig.referralRates,
                        level1: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ২য় লেভেল (%)
                </label>
                <input
                  type="number"
                  value={draftConfig.referralRates.level2}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      referralRates: {
                        ...draftConfig.referralRates,
                        level2: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ৩য় লেভেল (%)
                </label>
                <input
                  type="number"
                  value={draftConfig.referralRates.level3}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      referralRates: {
                        ...draftConfig.referralRates,
                        level3: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নিবন্ধন বোনাস
                </label>
                <input
                  type="number"
                  value={draftConfig.signupBonus}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      signupBonus: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টেলিগ্রাম বোনাস
                </label>
                <input
                  type="number"
                  value={draftConfig.telegramBonus}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      telegramBonus: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সর্বনিম্ন ডিপোজিট
                </label>
                <input
                  type="number"
                  value={draftConfig.minDeposit}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      minDeposit: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সর্বনিম্ন উত্তোলন
                </label>
                <input
                  type="number"
                  value={draftConfig.minWithdraw}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      minWithdraw: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
            </div>

            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-sm font-bold cursor-pointer"
            >
              সেটিংস সংরক্ষণ করুন
            </button>
          </form>
        )}

        {/* TAB 5: PLANS EDITOR */}
        {tab === 'plans' && (
          <form
            onSubmit={handleSavePlans}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm"
          >
            <h2 className="font-bold text-base text-slate-900">
              সকল প্ল্যানের মূল্য ও দৈনিক আয় নিয়ন্ত্রণ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draftPlans.map((plan, idx) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                >
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => {
                      const next = [...draftPlans];
                      next[idx] = { ...plan, name: e.target.value };
                      setDraftPlans(next);
                    }}
                    className="w-full min-h-[40px] px-3 rounded-lg border border-slate-200 bg-white text-sm font-bold"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500">
                        দাম (৳)
                      </label>
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) => {
                          const next = [...draftPlans];
                          next[idx] = { ...plan, price: Number(e.target.value) };
                          setDraftPlans(next);
                        }}
                        className="w-full min-h-[40px] px-2.5 rounded-lg border border-slate-200 bg-white text-sm font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">
                        দৈনিক আয় (৳)
                      </label>
                      <input
                        type="number"
                        value={plan.dailyIncome}
                        onChange={(e) => {
                          const next = [...draftPlans];
                          next[idx] = {
                            ...plan,
                            dailyIncome: Number(e.target.value),
                          };
                          setDraftPlans(next);
                        }}
                        className="w-full min-h-[40px] px-2.5 rounded-lg border border-slate-200 bg-white text-sm font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">
                        চক্র (দিন)
                      </label>
                      <input
                        type="number"
                        value={plan.cycleDays}
                        onChange={(e) => {
                          const next = [...draftPlans];
                          next[idx] = {
                            ...plan,
                            cycleDays: Number(e.target.value),
                          };
                          setDraftPlans(next);
                        }}
                        className="w-full min-h-[40px] px-2.5 rounded-lg border border-slate-200 bg-white text-sm font-mono-num"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold cursor-pointer"
            >
              প্ল্যান পরিবর্তন সংরক্ষণ করুন
            </button>
          </form>
        )}

        {/* TAB 6: ADMIN PASSWORD */}
        {tab === 'security' && (
          <form
            onSubmit={handleUpdateAdminCreds}
            className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md space-y-4 shadow-sm"
          >
            <h2 className="font-bold text-base text-slate-900">
              এডমিন লগইন তথ্য পরিবর্তন
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                বর্তমান এডমিন পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                value={curAdminPass}
                onChange={(e) => setCurAdminPass(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                নতুন ইউজারনেম
              </label>
              <input
                type="text"
                required
                value={newAdminUser}
                onChange={(e) => setNewAdminUser(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                নতুন পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[46px] rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-sm font-bold cursor-pointer"
            >
              পাসওয়ার্ড আপডেট করুন
            </button>
          </form>
        )}
      </main>
    </div>
  );
};
