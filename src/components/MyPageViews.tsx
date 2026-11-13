import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  FileText,
  Headphones,
  KeyRound,
  LogOut,
  PackageCheck,
  Send,
  Wallet,
} from 'lucide-react';
import { BRAND_ASSETS } from '../lib/assets';
import { METHOD_LABELS, formatBDT } from '../lib/defaults';
import {
  claimDailyIncome,
  updateLoginPassword,
  updateWalletSettings,
} from '../lib/storeService';
import type {
  AppConfig,
  Investment,
  Member,
  PaymentMethod,
  TabKey,
  Transaction,
} from '../types';

interface MyPageViewsProps {
  activeSubTab:
    | 'my'
    | 'records'
    | 'products'
    | 'wallet_settings'
    | 'company';
  config: AppConfig;
  member: Member;
  investments: Investment[];
  transactions: Transaction[];
  onNavigate: (tab: TabKey) => void;
  onLogout: () => void;
}

export const MyPageViews: React.FC<MyPageViewsProps> = ({
  activeSubTab,
  config,
  member,
  investments,
  transactions,
  onNavigate,
  onLogout,
}) => {
  const [walletMethod, setWalletMethod] = useState<PaymentMethod>(
    member.walletMethod || 'bkash'
  );
  const [walletNumber, setWalletNumber] = useState(member.walletNumber || '');
  const [newWithdrawPass, setNewWithdrawPass] = useState('');
  const [oldLoginPass, setOldLoginPass] = useState('');
  const [newLoginPass, setNewLoginPass] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleClaim = async (invId: string) => {
    setBusyId(invId);
    setMsg(null);
    try {
      const won = await claimDailyIncome(member.phone, invId);
      setMsg({
        type: 'ok',
        text: `সফলভাবে ${formatBDT(won)} দৈনিক আয় আপনার ব্যালেন্সে যোগ হয়েছে!`,
      });
    } catch (err) {
      setMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'দৈনিক আয় সংগ্রহ ব্যর্থ হয়েছে।',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await updateWalletSettings(
        member.phone,
        walletMethod,
        walletNumber,
        newWithdrawPass || undefined
      );
      setNewWithdrawPass('');
      setMsg({ type: 'ok', text: 'ওয়ালেট ও উত্তোলন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে।' });
    } catch (err) {
      setMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ হয়েছে।',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await updateLoginPassword(member.phone, oldLoginPass, newLoginPass);
      setOldLoginPass('');
      setNewLoginPass('');
      setMsg({ type: 'ok', text: 'লগইন পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।' });
    } catch (err) {
      setMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।',
      });
    }
  };

  if (activeSubTab !== 'my') {
    const titles: Record<string, string> = {
      records: 'অ্যাকাউন্ট রেকর্ডস',
      products: 'আমার পণ্যসমূহ ও দৈনিক আয়',
      wallet_settings: 'বিকাশ/নগদ/রকেট ও পাসওয়ার্ড সেটিংস',
      company: 'কোম্পানি প্রোফাইল',
    };

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <button
            type="button"
            onClick={() => onNavigate('my')}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
            aria-label="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={BRAND_ASSETS.logo}
            alt="Feedex লোগো"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
          />
          <h1 className="font-bold text-base text-slate-900">
            {titles[activeSubTab]}
          </h1>
        </div>

        {msg && (
          <div
            className={`p-3.5 rounded-xl border text-sm font-medium ${
              msg.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {msg.text}
          </div>
        )}

        {activeSubTab === 'records' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                কোনো লেনদেনের রেকর্ড পাওয়া যায়নি।
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{t.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(t.createdAt).toLocaleString('bn-BD')}
                      </p>
                    </div>
                    <span
                      className={`font-bold font-mono-num whitespace-nowrap ${
                        t.amount >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {t.amount >= 0 ? `+${formatBDT(t.amount)}` : formatBDT(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investments.length === 0 ? (
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  আপনার কোনো সক্রিয় প্ল্যান নেই
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="min-h-[42px] px-4 rounded-xl bg-purple-900 text-white text-xs font-semibold cursor-pointer"
                >
                  প্ল্যান দেখুন
                </button>
              </div>
            ) : (
              investments.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">
                      {inv.planName}
                    </h3>
                    <span
                      className={`text-xs font-bold ${
                        inv.status === 'active'
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {inv.status === 'active' ? 'চলমান' : 'সম্পন্ন'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                    <div>
                      <p className="text-slate-500">দৈনিক আয়</p>
                      <p className="font-bold font-mono-num text-emerald-700">
                        {formatBDT(inv.dailyIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">সংগৃহীত</p>
                      <p className="font-bold font-mono-num text-slate-900">
                        {inv.daysClaimed}/{inv.cycleDays} দিন
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">মূল্য</p>
                      <p className="font-bold font-mono-num text-purple-900">
                        {formatBDT(inv.price)}
                      </p>
                    </div>
                  </div>
                  {inv.status === 'active' && (
                    <button
                      type="button"
                      disabled={busyId === inv.id}
                      onClick={() => handleClaim(inv.id)}
                      className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
                    >
                      {busyId === inv.id
                        ? 'সংগ্রহ হচ্ছে...'
                        : `আজকের আয় সংগ্রহ করুন (${formatBDT(inv.dailyIncome)})`}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeSubTab === 'wallet_settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form
              onSubmit={handleSaveWallet}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm"
            >
              <h2 className="font-bold text-sm text-slate-900">
                বিকাশ / নগদ / রকেট নম্বর সেট করুন
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {(['bkash', 'nagad', 'rocket'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setWalletMethod(m)}
                    className={`min-h-[44px] rounded-xl border text-xs font-bold cursor-pointer ${
                      walletMethod === m
                        ? 'bg-purple-900 text-white border-purple-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {METHOD_LABELS[m]}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ওয়ালেট মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  required
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নতুন উত্তোলন পাসওয়ার্ড (ঐচ্ছিক)
                </label>
                <input
                  type="password"
                  value={newWithdrawPass}
                  onChange={(e) => setNewWithdrawPass(e.target.value)}
                  placeholder="কমপক্ষে ৪ অক্ষর"
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-sm font-bold cursor-pointer"
              >
                ওয়ালেট সংরক্ষণ করুন
              </button>
            </form>

            <form
              onSubmit={handleChangePassword}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm"
            >
              <h2 className="font-bold text-sm text-slate-900">
                লগইন পাসওয়ার্ড পরিবর্তন
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বর্তমান পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  required
                  value={oldLoginPass}
                  onChange={(e) => setOldLoginPass(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  required
                  value={newLoginPass}
                  onChange={(e) => setNewLoginPass(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold cursor-pointer"
              >
                পাসওয়ার্ড আপডেট করুন
              </button>
            </form>
          </div>
        )}

        {activeSubTab === 'company' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <img
              src={BRAND_ASSETS.banners[1]}
              alt="FeedexDigital গ্লোবাল হাব"
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover"
            />
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={BRAND_ASSETS.logo}
                  alt="Feedex লোগো"
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                />
                <h2 className="font-bold text-lg text-purple-950">
                  FeedexDigital গ্লোবাল পার্টনারস
                </h2>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                FeedexDigital আন্তর্জাতিক এয়ার কার্গো, এক্সপ্রেস পার্সেল সর্টিং এবং
                ডিজিটাল লজিস্টিকস অংশীদারিত্বের মাধ্যমে সদস্যদের জন্য নিয়মিত আয়ের
                সুযোগ তৈরি করে। বিকাশ, নগদ ও রকেট পেমেন্টের মাধ্যমে বাংলাদেশের
                ব্যবহারকারীরা সহজেই লেনদেন সম্পন্ন করতে পারেন।
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={BRAND_ASSETS.logo}
              alt="Feedex লোগো"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-2xl bg-white p-0.5 object-cover"
            />
            <div>
              <p className="font-mono-num font-bold text-base">{member.phone}</p>
              <p className="text-xs text-purple-200 font-mono-num">
                ID : {member.id} · কোড: {member.referralCode}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/15">
          <div>
            <p className="text-xs text-purple-200">বর্তমান ব্যালেন্স</p>
            <p className="font-bold font-mono-num text-lg text-orange-300">
              {formatBDT(member.balance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-purple-200">মোট ডিপোজিট</p>
            <p className="font-bold font-mono-num text-base">
              {formatBDT(member.totalRecharge)}
            </p>
          </div>
          <div>
            <p className="text-xs text-purple-200">মোট উত্তোলন</p>
            <p className="font-bold font-mono-num text-base">
              {formatBDT(member.totalWithdraw)}
            </p>
          </div>
          <div>
            <p className="text-xs text-purple-200">মোট আয়</p>
            <p className="font-bold font-mono-num text-base text-emerald-300">
              {formatBDT(member.totalEarned)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('recharge')}
            className="min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer"
          >
            ডিপোজিট করুন
          </button>
          <button
            type="button"
            onClick={() => onNavigate('withdraw')}
            className="min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
          >
            উত্তোলন করুন
          </button>
        </div>
      </div>

      {/* Telegram & Support Quick Cards */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={config.telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[52px] bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center gap-2.5 text-xs font-bold text-sky-800 hover:bg-sky-50 transition-colors"
        >
          <Send className="w-4 h-4 text-sky-600 shrink-0" />
          টেলিগ্রাম চ্যানেল
        </a>
        <a
          href={config.supportLink}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[52px] bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center gap-2.5 text-xs font-bold text-orange-800 hover:bg-orange-50 transition-colors"
        >
          <Headphones className="w-4 h-4 text-orange-600 shrink-0" />
          সাপোর্ট সেন্টার
        </a>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
        {[
          {
            key: 'products' as TabKey,
            label: 'আমার পণ্যসমূহ (দৈনিক আয় সংগ্রহ)',
            icon: PackageCheck,
          },
          {
            key: 'records' as TabKey,
            label: 'অ্যাকাউন্ট রেকর্ডস',
            icon: FileText,
          },
          {
            key: 'wallet_settings' as TabKey,
            label: 'বিকাশ/নগদ/রকেট ও পাসওয়ার্ড',
            icon: Wallet,
          },
          {
            key: 'company' as TabKey,
            label: 'কোম্পানি প্রোফাইল',
            icon: Building2,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className="w-full min-h-[56px] px-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          );
        })}
        <button
          type="button"
          onClick={onLogout}
          className="w-full min-h-[56px] px-4 flex items-center justify-between hover:bg-red-50 transition-colors text-left cursor-pointer"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-red-700">
            <span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </span>
            অ্যাকাউন্ট থেকে লগআউট
          </span>
          <KeyRound className="w-4 h-4 text-red-300" />
        </button>
      </div>
    </div>
  );
};
