import React, { useEffect, useState } from 'react';
import { RefreshCw, Share2, Users } from 'lucide-react';
import { BRAND_ASSETS } from '../lib/assets';
import { formatBDT, maskPhone } from '../lib/defaults';
import { fetchTeamHierarchy, type TeamHierarchyData } from '../lib/storeService';
import type { AppConfig, Member, TabKey } from '../types';

interface TeamViewProps {
  config: AppConfig;
  member: Member;
  onNavigate: (tab: TabKey) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  config,
  member,
  onNavigate,
}) => {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<TeamHierarchyData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchTeamHierarchy(member.phone);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [member.phone]);

  const activeList =
    level === 1
      ? data?.level1 || []
      : level === 2
      ? data?.level2 || []
      : data?.level3 || [];

  const rates = config.referralRates;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src={BRAND_ASSETS.logo}
            alt="Feedex লোগো"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
          />
          <div>
            <h1 className="font-bold text-base text-slate-900">আমার টিম নেটওয়ার্ক</h1>
            <p className="text-xs text-slate-500">
              ৩-লেভেল রেফারেল কমিশন: {rates.level1}% · {rates.level2}% · {rates.level3}%
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="min-h-[40px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          রিফ্রেশ
        </button>
      </div>

      {/* Overview Stats */}
      <div className="bg-gradient-to-br from-purple-950 to-indigo-950 text-white rounded-2xl p-5 grid grid-cols-3 gap-3 shadow-sm">
        <div>
          <p className="text-xs text-purple-200">টিম রিচার্জ</p>
          <p className="font-bold font-mono-num text-lg sm:text-xl mt-1">
            {formatBDT(data?.totalTeamRecharge || 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-purple-200">টিম কমিশন আয়</p>
          <p className="font-bold font-mono-num text-lg sm:text-xl mt-1 text-emerald-300">
            {formatBDT(data?.totalCommissionEarned || 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-purple-200">মোট সদস্য</p>
          <p className="font-bold font-mono-num text-lg sm:text-xl mt-1 text-orange-300">
            {data?.totalTeamCount || 0} জন
          </p>
        </div>
      </div>

      {/* 3-Level Segmented Filter */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-xl">
        {[
          { lvl: 1 as const, label: `১ম লেভেল (${rates.level1}%)`, count: data?.level1.length || 0 },
          { lvl: 2 as const, label: `২য় লেভেল (${rates.level2}%)`, count: data?.level2.length || 0 },
          { lvl: 3 as const, label: `৩য় লেভেল (${rates.level3}%)`, count: data?.level3.length || 0 },
        ].map((item) => (
          <button
            key={item.lvl}
            type="button"
            onClick={() => setLevel(item.lvl)}
            className={`min-h-[44px] px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              level === item.lvl
                ? 'bg-purple-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        {loading ? (
          <p className="text-xs text-slate-500 py-8 text-center">টিম ডেটা লোড হচ্ছে...</p>
        ) : activeList.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              এই লেভেলে এখনো কোনো সদস্য নেই
            </p>
            <p className="text-xs text-slate-500">
              আপনার রেফার লিংক শেয়ার করে টিম গড়ে তুলুন এবং প্রতিটি ডিপোজিটে কমিশন পান।
            </p>
            <button
              type="button"
              onClick={() => onNavigate('invite')}
              className="min-h-[42px] px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              আমন্ত্রণ লিংক শেয়ার করুন
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeList.map((m) => (
              <div
                key={m.id}
                className="py-3 flex items-center justify-between text-xs sm:text-sm"
              >
                <div>
                  <p className="font-bold font-mono-num text-slate-900">
                    {maskPhone(m.phone)}
                  </p>
                  <p className="text-xs text-slate-500 font-mono-num">
                    ID: {m.id} · যোগদান:{' '}
                    {new Date(m.createdAt).toLocaleDateString('bn-BD')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">মোট ডিপোজিট</p>
                  <p className="font-bold font-mono-num text-purple-900">
                    {formatBDT(m.totalRecharge)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
