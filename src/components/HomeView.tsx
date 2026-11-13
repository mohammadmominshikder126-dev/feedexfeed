import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Gift,
  Headphones,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { BRAND_ASSETS } from '../lib/assets';
import { METHOD_LABELS, formatBDT } from '../lib/defaults';
import {
  buyPlan,
  claimTelegramBonus,
  spinLuckyWheel,
} from '../lib/storeService';
import type {
  AppConfig,
  LivePayment,
  Member,
  PlanCategory,
  PlanItem,
  TabKey,
} from '../types';

interface HomeViewProps {
  config: AppConfig;
  member: Member;
  livePayments: LivePayment[];
  onNavigate: (tab: TabKey) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  config,
  member,
  livePayments,
  onNavigate,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [category, setCategory] = useState<PlanCategory>('daily');
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [showWheel, setShowWheel] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<number | null>(null);
  const [claimingTg, setClaimingTg] = useState(false);

  const banners = BRAND_ASSETS.banners;
  const filteredPlans = (config.plans || []).filter((p) => p.category === category);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleConfirmBuy = async () => {
    if (!selectedPlan) return;
    setBuying(true);
    setFeedback(null);
    try {
      await buyPlan(member.phone, selectedPlan.id);
      setFeedback({
        type: 'ok',
        text: `${selectedPlan.name} সফলভাবে ক্রয় সম্পন্ন হয়েছে! আপনার পণ্যসমূহ ট্যাবে দৈনিক আয় সংগ্রহ করতে পারবেন।`,
      });
      setSelectedPlan(null);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'প্ল্যান ক্রয় ব্যর্থ হয়েছে।',
      });
      setSelectedPlan(null);
    } finally {
      setBuying(false);
    }
  };

  const handleClaimTelegram = async () => {
    window.open(config.telegramLink, '_blank', 'noopener,noreferrer');
    if (member.telegramBonusClaimed) return;
    setClaimingTg(true);
    setFeedback(null);
    try {
      const won = await claimTelegramBonus(member.phone);
      setFeedback({
        type: 'ok',
        text: `টেলিগ্রামে যুক্ত হওয়ায় ${formatBDT(won)} বোনাস আপনার ব্যালেন্সে যোগ হয়েছে!`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'বোনাস নেওয়া সম্ভব হয়নি।',
      });
    } finally {
      setClaimingTg(false);
    }
  };

  const handleSpin = async () => {
    setSpinning(true);
    setWheelResult(null);
    try {
      const won = await spinLuckyWheel(member.phone);
      setTimeout(() => {
        setWheelResult(won);
        setSpinning(false);
      }, 900);
    } catch (err) {
      setSpinning(false);
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'স্পিন করা যায়নি।',
      });
      setShowWheel(false);
    }
  };

  const tickerItems = [...livePayments, ...livePayments];

  return (
    <div className="space-y-5">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between gap-3 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.text}</span>
          {feedback.type === 'err' && member.totalRecharge <= 0 && (
            <button
              type="button"
              onClick={() => onNavigate('recharge')}
              className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              ডিপোজিট করুন
            </button>
          )}
        </div>
      )}

      {/* Hero Carousel + Balance Overview on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-purple-950 aspect-[16/9] lg:aspect-auto lg:min-h-[240px] border border-slate-200 shadow-sm">
          <img
            src={banners[slideIdx]}
            alt="FeedexDigital কার্গো পার্টনার ব্যানার"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-950/35 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-sm">
            <img
              src={BRAND_ASSETS.logo}
              alt="Feedex লোগো"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded object-cover"
            />
            <span className="font-display text-xs font-bold text-purple-950">
              FeedexDigital
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-14 text-white">
            <p className="text-xs text-orange-300 font-semibold">
              গ্লোবাল লজিস্টিকস পার্টনার প্রোগ্রাম
            </p>
            <h2 className="text-lg sm:text-xl font-bold leading-snug">
              বিশ্বব্যাপী এয়ার কার্গো ও ডিজিটাল রিটার্ন নেটওয়ার্ক
            </h2>
          </div>
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
            <button
              type="button"
              aria-label="পূর্ববর্তী স্লাইড"
              onClick={() =>
                setSlideIdx((p) => (p - 1 + banners.length) % banners.length)
              }
              className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="পরবর্তী স্লাইড"
              onClick={() => setSlideIdx((p) => (p + 1) % banners.length)}
              className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Account Quick Balance Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-200">অ্যাকাউন্ট ব্যালেন্স</span>
              <span className="text-xs font-mono-num text-orange-300">
                ID: {member.id}
              </span>
            </div>
            <p className="text-3xl font-bold font-mono-num mt-1">
              {formatBDT(member.balance)}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/15 text-xs">
              <div>
                <p className="text-purple-200">মোট ডিপোজিট</p>
                <p className="font-semibold font-mono-num text-sm mt-0.5">
                  {formatBDT(member.totalRecharge)}
                </p>
              </div>
              <div>
                <p className="text-purple-200">মোট আয়</p>
                <p className="font-semibold font-mono-num text-sm mt-0.5 text-emerald-300">
                  {formatBDT(member.totalEarned)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => onNavigate('recharge')}
              className="min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              ডিপোজিট
            </button>
            <button
              type="button"
              onClick={() => onNavigate('withdraw')}
              className="min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              উত্তোলন
            </button>
          </div>
        </div>
      </div>

      {/* 4 Quick Action Buttons */}
      <div className="grid grid-cols-4 gap-2.5 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
        <button
          type="button"
          onClick={() => onNavigate('recharge')}
          className="min-h-[64px] rounded-xl hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5" />
          </span>
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            রিচার্জ
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('withdraw')}
          className="min-h-[64px] rounded-xl hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
            <ArrowUpFromLine className="w-5 h-5" />
          </span>
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            উত্তোলন
          </span>
        </button>

        <a
          href={config.telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[64px] rounded-xl hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 transition-colors"
        >
          <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </span>
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            চ্যানেল
          </span>
        </a>

        <a
          href={config.supportLink}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[64px] rounded-xl hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 transition-colors"
        >
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </span>
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            অনলাইন
          </span>
        </a>
      </div>

      {/* Telegram 50 Taka Bonus Strip (User's exact requested wording) */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 rounded-2xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm sm:text-base font-bold">
              টেলিগ্রামে যুক্ত হন এবং {config.telegramBonus}টাকা বোনাস পান
            </p>
            <p className="text-xs text-sky-100">
              সকল আপডেট, পেমেন্ট প্রুফ এবং সরাসরি হেল্পলাইন পেতে অফিসিয়াল গ্রুপে যুক্ত হোন
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={claimingTg}
            onClick={handleClaimTelegram}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-indigo-900 hover:bg-sky-50 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
          >
            {member.telegramBonusClaimed
              ? 'টেলিগ্রামে যুক্ত হন'
              : claimingTg
              ? 'প্রক্রিয়াধীন...'
              : `যুক্ত হয়ে ৳ ${config.telegramBonus} নিন`}
          </button>
          <button
            type="button"
            onClick={() => setShowWheel(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            লাকি স্পিন
          </button>
        </div>
      </div>

      {/* Category Segmented Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-xl w-full sm:w-auto sm:min-w-[320px]">
          <button
            type="button"
            onClick={() => setCategory('daily')}
            className={`min-h-[44px] px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              category === 'daily'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            দৈনিক আয় প্ল্যান
          </button>
          <button
            type="button"
            onClick={() => setCategory('welfare')}
            className={`min-h-[44px] px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              category === 'welfare'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            কল্যাণ প্ল্যান
          </button>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('products')}
          className="hidden sm:inline-flex min-h-[44px] px-4 items-center gap-1.5 text-xs font-semibold text-purple-900 hover:underline whitespace-nowrap cursor-pointer"
        >
          <TrendingUp className="w-4 h-4" />
          আমার সক্রিয় প্ল্যান দেখুন
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={
                    BRAND_ASSETS.planImages[plan.imageKey] ||
                    BRAND_ASSETS.planImages.vip_express
                  }
                  alt={plan.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                  <h3 className="font-bold text-base leading-tight">
                    {plan.name}
                  </h3>
                  {plan.badge && (
                    <span className="text-[11px] font-semibold bg-orange-600 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">প্ল্যান মূল্য</p>
                  <p className="font-bold font-mono-num text-purple-950">
                    {formatBDT(plan.price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">দৈনিক আয়</p>
                  <p className="font-bold font-mono-num text-emerald-700">
                    {formatBDT(plan.dailyIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">সময়কাল</p>
                  <p className="font-semibold font-mono-num text-slate-800">
                    {plan.cycleDays} দিন
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">মোট রিটার্ন</p>
                  <p className="font-bold font-mono-num text-orange-600">
                    {formatBDT(plan.totalReturn)}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className="w-full min-h-[44px] rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                এখনই কিনুন
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Continuous Moving Live Payments Feed at Bottom of Home */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">
              লাইভ পেমেন্ট ও ডিপোজিট আপডেট
            </h3>
          </div>
          <span className="text-xs text-slate-500">স্বয়ংক্রিয় রিয়েল-টাইম ফিড</span>
        </div>

        <div className="h-44 overflow-hidden relative rounded-xl bg-slate-50 border border-slate-100">
          <div className="animate-feed-ticker divide-y divide-slate-200/70">
            {tickerItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="px-3.5 py-2.5 flex items-center justify-between text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap ${
                      item.type === 'withdraw'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-900'
                    }`}
                  >
                    {item.type === 'withdraw' ? 'উত্তোলন সম্পন্ন' : 'ডিপোজিট'}
                  </span>
                  <span className="font-mono-num font-semibold text-slate-800 truncate">
                    {item.maskedPhone}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">·</span>
                  <span className="text-slate-600 text-xs">
                    {METHOD_LABELS[item.method]}
                  </span>
                </div>
                <span className="font-bold font-mono-num text-slate-900 whitespace-nowrap">
                  {formatBDT(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan Purchase Confirmation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <img
                src={BRAND_ASSETS.logo}
                alt="Feedex লোগো"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl border border-slate-200 object-cover"
              />
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  প্ল্যান ক্রয় নিশ্চিত করুন
                </h3>
                <p className="text-xs text-slate-500">{selectedPlan.name}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-sm border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-600">প্ল্যান মূল্য</span>
                <span className="font-bold font-mono-num">
                  {formatBDT(selectedPlan.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">দৈনিক আয়</span>
                <span className="font-bold font-mono-num text-emerald-700">
                  {formatBDT(selectedPlan.dailyIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">চক্র সময়</span>
                <span className="font-semibold font-mono-num">
                  {selectedPlan.cycleDays} দিন
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-semibold">মোট আয়</span>
                <span className="font-bold font-mono-num text-orange-600">
                  {formatBDT(selectedPlan.totalReturn)}
                </span>
              </div>
            </div>

            {member.totalRecharge <= 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                সতর্কতা: প্ল্যান কিনতে হলে প্রথমে কমপক্ষে একবার বিকাশ, নগদ বা রকেট দিয়ে
                ডিপোজিট করতে হবে।
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="min-h-[44px] rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={buying}
                onClick={handleConfirmBuy}
                className="min-h-[44px] rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
              >
                {buying ? 'প্রক্রিয়াধীন...' : 'নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Lucky Wheel Modal */}
      {showWheel && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center">
              <Gift className={`w-8 h-8 ${spinning ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                দৈনিক লাকি স্পিন বোনাস
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                প্রতিদিন একবার স্পিন করে জিতে নিন ৳ ৫ থেকে ৳ ৫০ পর্যন্ত বোনাস!
              </p>
            </div>

            {wheelResult !== null && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-base">
                অভিনন্দন! আপনি {formatBDT(wheelResult)} বোনাস জিতেছেন!
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowWheel(false);
                  setWheelResult(null);
                }}
                className="min-h-[44px] rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                disabled={spinning || wheelResult !== null}
                onClick={handleSpin}
                className="min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                {spinning ? 'ঘুরছে...' : 'স্পিন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
