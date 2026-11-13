import React, { useState } from 'react';
import {
  ArrowRight,
  Headphones,
  Lock,
  Phone,
  Send,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { BRAND_ASSETS } from '../lib/assets';
import { formatBDT } from '../lib/defaults';
import { loginMember, registerMember } from '../lib/storeService';
import type { AppConfig, Member } from '../types';

interface AuthViewProps {
  config: AppConfig;
  initialRefCode?: string;
  onAuthenticated: (member: Member, isNewRegistration: boolean) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  config,
  initialRefCode = '',
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(
    initialRefCode ? 'register' : 'login'
  );
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState(initialRefCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const m = await loginMember(phone, password);
        onAuthenticated(m, false);
      } else {
        const m = await registerMember(phone, password, refCode);
        onAuthenticated(m, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'অপারেশন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const m = await loginMember('01712345678', '123456');
      onAuthenticated(m, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ডেমো লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Corporate Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={BRAND_ASSETS.logo}
              alt="FeedexDigital লোগো"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
            />
            <span className="font-display text-lg font-bold tracking-tight text-purple-950 whitespace-nowrap">
              Feedex<span className="text-orange-600">Digital</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={config.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              টেলিগ্রাম
            </a>
            <a
              href={config.supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Headphones className="w-3.5 h-3.5" />
              সাপোর্ট
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Visual Hero */}
        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden bg-purple-950 min-h-[220px] lg:min-h-[480px] shadow-sm border border-slate-200">
          <img
            src={BRAND_ASSETS.banners[0]}
            alt="FeedexDigital কার্গো পার্টনার নেটওয়ার্ক"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/95 via-purple-950/55 to-purple-950/20" />
          <div className="relative h-full flex flex-col justify-between p-6 text-white">
            <div className="flex items-center gap-2.5">
              <img
                src={BRAND_ASSETS.logo}
                alt="Feedex লোগো"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover bg-white p-0.5"
              />
              <div>
                <p className="font-display font-bold text-base leading-tight">
                  FeedexDigital Partners
                </p>
                <p className="text-xs text-orange-200">
                  গ্লোবাল কার্গো ও ডিজিটাল ইনকাম প্ল্যাটফর্ম
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-12">
              <p className="text-xs font-medium text-orange-300">
                নতুন সদস্য বোনাস অফার
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold leading-snug">
                নতুন অ্যাকাউন্ট নিবন্ধনেই পাচ্ছেন{' '}
                <span className="text-orange-400 font-mono-num">
                  {formatBDT(config.signupBonus)}
                </span>{' '}
                তাৎক্ষণিক বোনাস
              </h1>
              <p className="text-sm text-slate-200 leading-relaxed max-w-md">
                বিকাশ, নগদ ও রকেটের মাধ্যমে দ্রুত ডিপোজিট এবং ৩-লেভেল রেফারেল
                কমিশনসহ দৈনিক আয়ের বিশ্বস্ত মাধ্যম।
              </p>
            </div>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm flex flex-col justify-between">
          <div>
            {/* Segmented Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`min-h-[44px] rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  mode === 'login'
                    ? 'bg-purple-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                লগইন করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`min-h-[44px] rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  mode === 'register'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                নতুন নিবন্ধন (+{formatBDT(config.signupBonus)})
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  মোবাইল নম্বর
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-700 focus:outline-none text-sm font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                    className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-700 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    রেফার কোড (ঐচ্ছিক)
                  </label>
                  <div className="relative">
                    <UserPlus className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value)}
                      placeholder="যেমন: FDX731786"
                      className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-700 focus:outline-none text-sm font-mono-num uppercase"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading
                  ? 'অপেক্ষা করুন...'
                  : mode === 'login'
                  ? 'লগইন করুন'
                  : `নিবন্ধন করে ${formatBDT(config.signupBonus)} বোনাস নিন`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* 1-Click Demo Login */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={handleDemoLogin}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-800" />
                ডেমো অ্যাকাউন্ট দিয়ে প্রবেশ করুন (01712345678 / 123456)
              </button>
            </div>
          </div>

          {/* Direct Community & Support Links */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <a
              href={config.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              অফিসিয়াল টেলিগ্রাম
            </a>
            <a
              href={config.supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Headphones className="w-4 h-4" />
              সাপোর্ট সেন্টার
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
