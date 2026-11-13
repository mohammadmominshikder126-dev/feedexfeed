import { useEffect, useState } from 'react';
import {
  Download,
  Headphones,
  Home,
  Send,
  Share2,
  User,
  Users,
  X,
} from 'lucide-react';
import { AdminPanelView } from './components/AdminPanelView';
import { AuthView } from './components/AuthView';
import { CommunityViews } from './components/CommunityViews';
import { HomeView } from './components/HomeView';
import { MyPageViews } from './components/MyPageViews';
import { TeamView } from './components/TeamView';
import { WalletViews } from './components/WalletViews';
import { BRAND_ASSETS } from './lib/assets';
import {
  DEFAULT_APP_CONFIG,
  SEED_LIVE_PAYMENTS,
  formatBDT,
} from './lib/defaults';
import {
  ensureCloudInitialized,
  subscribeAppConfig,
  subscribeLivePayments,
  subscribeMember,
  subscribeMemberDeposits,
  subscribeMemberInvestments,
  subscribeMemberTransactions,
  subscribeMemberWithdrawals,
} from './lib/storeService';
import type {
  AppConfig,
  Deposit,
  Investment,
  LivePayment,
  Member,
  TabKey,
  Transaction,
  Withdrawal,
} from './types';

function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname.toLowerCase();
  const h = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    p === '/admin' ||
    p.endsWith('/admin') ||
    h.startsWith('#/admin') ||
    params.get('page') === 'admin'
  );
}

function getInitialRefCode(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return (params.get('ref') || '').trim().toUpperCase();
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [livePayments, setLivePayments] =
    useState<LivePayment[]>(SEED_LIVE_PAYMENTS);

  const [sessionPhone, setSessionPhone] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fdx_member_phone');
    } catch {
      return null;
    }
  });
  const [member, setMember] = useState<Member | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [welcomeBanner, setWelcomeBanner] = useState<boolean>(false);

  // Sync admin route on popstate/hashchange
  useEffect(() => {
    const onRouteChange = () => setIsAdminRoute(checkIsAdminRoute());
    window.addEventListener('popstate', onRouteChange);
    window.addEventListener('hashchange', onRouteChange);
    return () => {
      window.removeEventListener('popstate', onRouteChange);
      window.removeEventListener('hashchange', onRouteChange);
    };
  }, []);

  // Boot cloud DB & attach global real-time config + live payments listeners
  useEffect(() => {
    ensureCloudInitialized().catch(console.error);
    const unsubCfg = subscribeAppConfig(setConfig);
    const unsubLp = subscribeLivePayments(setLivePayments);
    return () => {
      unsubCfg();
      unsubLp();
    };
  }, []);

  // Attach real-time listeners for logged-in member
  useEffect(() => {
    if (!sessionPhone) {
      setMember(null);
      setDeposits([]);
      setWithdrawals([]);
      setInvestments([]);
      setTransactions([]);
      return;
    }
    const unsubM = subscribeMember(sessionPhone, (m) => {
      if (!m || m.blocked) {
        setMember(null);
        localStorage.removeItem('fdx_member_phone');
        setSessionPhone(null);
        return;
      }
      setMember(m);
    });
    const unsubD = subscribeMemberDeposits(sessionPhone, setDeposits);
    const unsubW = subscribeMemberWithdrawals(sessionPhone, setWithdrawals);
    const unsubI = subscribeMemberInvestments(sessionPhone, setInvestments);
    const unsubT = subscribeMemberTransactions(sessionPhone, setTransactions);
    return () => {
      unsubM();
      unsubD();
      unsubW();
      unsubI();
      unsubT();
    };
  }, [sessionPhone]);

  const handleExitAdmin = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  if (isAdminRoute) {
    return <AdminPanelView config={config} onExitAdmin={handleExitAdmin} />;
  }

  const handleAuthenticated = (loggedMember: Member, _isNew: boolean) => {
    localStorage.setItem('fdx_member_phone', loggedMember.phone);
    setSessionPhone(loggedMember.phone);
    setMember(loggedMember);
    setActiveTab('home');
    setWelcomeBanner(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('fdx_member_phone');
    setSessionPhone(null);
    setMember(null);
    setWelcomeBanner(false);
  };

  if (!member) {
    return (
      <AuthView
        config={config}
        initialRefCode={getInitialRefCode()}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  const navItems: { key: TabKey; label: string; icon: typeof Home }[] = [
    { key: 'home', label: 'হোম', icon: Home },
    { key: 'team', label: 'টিম', icon: Users },
    { key: 'invite', label: 'আমন্ত্রণ', icon: Share2 },
    { key: 'download', label: 'ডাউনলোড', icon: Download },
    { key: 'my', label: 'আমার পেজ', icon: User },
  ];

  const isBottomTab = (k: TabKey) =>
    ['home', 'team', 'invite', 'download', 'my'].includes(k);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-8">
      {/* 3-Zone Top Bar with FeedexDigital Logo */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer"
          >
            <img
              src={BRAND_ASSETS.logo}
              alt="FeedexDigital লোগো"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
            />
            <span className="font-display text-lg font-bold tracking-tight text-purple-950 whitespace-nowrap">
              Feedex<span className="text-orange-600">Digital</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
                  activeTab === item.key
                    ? 'text-purple-900 border-b-2 border-orange-600'
                    : 'hover:text-slate-950'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setActiveTab('recharge')}
            className="min-h-[40px] px-3.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold font-mono-num whitespace-nowrap shrink-0 cursor-pointer"
          >
            {formatBDT(member.balance)}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5">
        {activeTab === 'home' && (
          <HomeView
            config={config}
            member={member}
            livePayments={livePayments}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'team' && (
          <TeamView config={config} member={member} onNavigate={setActiveTab} />
        )}
        {(activeTab === 'invite' || activeTab === 'download') && (
          <CommunityViews mode={activeTab} config={config} member={member} />
        )}
        {(activeTab === 'recharge' || activeTab === 'withdraw') && (
          <WalletViews
            mode={activeTab}
            config={config}
            member={member}
            deposits={deposits}
            withdrawals={withdrawals}
            onNavigate={setActiveTab}
          />
        )}
        {(activeTab === 'my' ||
          activeTab === 'records' ||
          activeTab === 'products' ||
          activeTab === 'wallet_settings' ||
          activeTab === 'company') && (
          <MyPageViews
            activeSubTab={activeTab}
            config={config}
            member={member}
            investments={investments}
            transactions={transactions}
            onNavigate={setActiveTab}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe">
        <div className="grid grid-cols-5 h-16 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              activeTab === item.key ||
              (!isBottomTab(activeTab) && item.key === 'my');
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  active ? 'text-purple-900' : 'text-slate-500'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? 'text-orange-600' : ''}`}
                />
                <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Post-Auth Telegram & Support Welcome Modal */}
      {welcomeBanner && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setWelcomeBanner(false)}
              aria-label="বন্ধ করুন"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center absolute top-3.5 right-3.5 text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <img
                src={BRAND_ASSETS.logo}
                alt="Feedex লোগো"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl border border-slate-200 object-cover"
              />
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  FeedexDigital-এ স্বাগতম!
                </h2>
                <p className="text-xs text-slate-500 font-mono-num">
                  আইডি: {member.id} · ব্যালেন্স: {formatBDT(member.balance)}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              যেকোনো সহায়তা, ডিপোজিট তথ্য এবং {formatBDT(config.telegramBonus)}{' '}
              বোনাসের জন্য আমাদের অফিসিয়াল টেলিগ্রাম চ্যানেল ও সাপোর্ট সেন্টারে যুক্ত
              থাকুন।
            </p>
            <div className="space-y-2.5">
              <a
                href={config.telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                অফিসিয়াল টেলিগ্রাম চ্যানেলে যুক্ত হন
              </a>
              <a
                href={config.supportLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Headphones className="w-4 h-4" />
                সাপোর্ট সেন্টারে যোগাযোগ করুন
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
