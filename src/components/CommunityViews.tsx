import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Headphones,
  Send,
  Share2,
  Smartphone,
} from 'lucide-react';
import { BRAND_ASSETS } from '../lib/assets';
import { QrMatrix } from './QrMatrix';
import type { AppConfig, Member } from '../types';

interface CommunityViewsProps {
  mode: 'invite' | 'download';
  config: AppConfig;
  member: Member;
}

export const CommunityViews: React.FC<CommunityViewsProps> = ({
  mode,
  config,
  member,
}) => {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://feedexdigital.com';
  const inviteUrl = `${origin}/?ref=${member.referralCode}`;

  const handleCopy = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      setCopiedType(null);
    }
  };

  if (mode === 'download') {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-3 shadow-sm">
          <img
            src={BRAND_ASSETS.logo}
            alt="Feedex লোগো"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
          />
          <div>
            <h1 className="font-bold text-base text-slate-900">
              FeedexDigital অ্যাপ ও কমিউনিটি
            </h1>
            <p className="text-xs text-slate-500">
              মোবাইল হোম স্ক্রিনে যুক্ত করুন এবং অফিসিয়াল চ্যানেলে যুক্ত থাকুন
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-950 to-indigo-950 text-white rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg">FeedexDigital ওয়েব অ্যাপ</h2>
              <p className="text-xs text-purple-200">
                Android ও iOS ব্রাউজারে দ্রুতগতির নিরাপদ ওয়েব অভিজ্ঞতা
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            আপনার ফোনের Chrome বা Safari ব্রাউজার মেনু থেকে{' '}
            <strong className="text-white">"Add to Home Screen"</strong> নির্বাচন করে
            সরাসরি অ্যাপের মতো ব্যবহার করতে পারবেন।
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href={config.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[46px] rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              অফিসিয়াল টেলিগ্রাম চ্যানেল
            </a>
            <a
              href={config.supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[46px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Headphones className="w-4 h-4" />
              ২৪/৭ লাইভ সাপোর্ট সেন্টার
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <p className="font-bold text-sm text-slate-900">
              ব্রাউজার ওয়েব শর্টকাট প্রস্তুত
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              কোনো থার্ড-পার্টি APK ছাড়াই সরাসরি ওয়েব থেকে সুরক্ষিত লগইন করুন।
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
        <img
          src={BRAND_ASSETS.logo}
          alt="Feedex লোগো"
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-lg object-cover border border-slate-200"
        />
        <div>
          <h1 className="font-bold text-base text-slate-900">
            বন্ধুদের আমন্ত্রণ জানান
          </h1>
          <p className="text-xs text-slate-500">
            রেফার করলে পাবেন {config.referralRates.level1}% (১ম),{' '}
            {config.referralRates.level2}% (২য়), এবং {config.referralRates.level3}%
            (৩য় লেভেল) কমিশন
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="lg:col-span-5 flex flex-col items-center text-center space-y-3">
          <QrMatrix value={inviteUrl} size={184} />
          <p className="text-xs text-slate-500">
            বন্ধুদের ক্যামেরা দিয়ে QR কোড স্ক্যান করিয়ে সরাসরি নিবন্ধন করান
          </p>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-500">
              আপনার আমন্ত্রণ কোড
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-num text-xl font-bold text-purple-950">
                {member.referralCode}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(member.referralCode, 'code')}
                className="min-h-[40px] px-3.5 rounded-lg bg-purple-900 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedType === 'code' ? (
                  <>
                    <Check className="w-4 h-4" /> কপি হয়েছে
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> কোড কপি
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-500">
              আপনার শেয়ারযোগ্য আমন্ত্রণ লিংক
            </p>
            <p className="text-xs font-mono-num text-slate-700 break-all bg-white p-2.5 rounded-lg border border-slate-200">
              {inviteUrl}
            </p>
            <button
              type="button"
              onClick={() => handleCopy(inviteUrl, 'link')}
              className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedType === 'link' ? (
                <>
                  <Check className="w-4 h-4" /> লিংক কপি হয়েছে
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" /> আমন্ত্রণ লিংক কপি করুন
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
