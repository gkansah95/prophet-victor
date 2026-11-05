import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  HeartHandshake,
  Home,
  Images,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Mic2,
  Moon,
  Phone,
  Settings,
  Share2,
  ShieldAlert,
  SlidersHorizontal,
  Sun,
  UserCircle,
  UserCog,
  X,
} from 'lucide-react';
import {
  AccountSettingsManager,
  BlogManager,
  NewsletterSubscribersManager,
  PrayerRequestsManager,
  SettingsSectionManager,
  TestimoniesManager,
} from '../../components/admin/CommunityAndSettingsManagers';
import {
  BooksManager,
  EventsManager,
  GalleryManager,
  SermonsManager,
} from '../../components/admin/ContentCrudManagers';
import {
  HomepageManager,
  ProfileManager,
} from '../../components/admin/ProfileAndHomepageManagers';
import { SliderManager } from '../../components/admin/SliderManager';
import { SeoHead } from '../../components/common/SeoHead';
import { useAuth } from '../../context/AuthContext';
import { useSiteData } from '../../context/SiteDataContext';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../lib/api';
import type { AdminOverviewStats } from '../../types/cms';

type AdminSectionKey =
  | 'overview'
  | 'profile'
  | 'homepage'
  | 'slider'
  | 'about'
  | 'sermons'
  | 'events'
  | 'books'
  | 'gallery'
  | 'testimonies'
  | 'blog'
  | 'prayers'
  | 'subscribers'
  | 'contact'
  | 'social'
  | 'website'
  | 'account';

interface SidebarNavItem {
  key: AdminSectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  { key: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { key: 'profile', label: 'Profile Management', icon: UserCircle },
  { key: 'homepage', label: 'Homepage Management', icon: Home },
  { key: 'slider', label: 'Slider Management', icon: SlidersHorizontal },
  { key: 'about', label: 'About the Pastor', icon: FileText },
  { key: 'sermons', label: 'Sermons', icon: Mic2 },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'books', label: 'Books and Publications', icon: BookOpen },
  { key: 'gallery', label: 'Gallery', icon: Images },
  { key: 'testimonies', label: 'Testimonies', icon: MessageSquareQuote },
  { key: 'blog', label: 'Blog and Devotionals', icon: FileText },
  { key: 'prayers', label: 'Prayer Requests', icon: HeartHandshake },
  { key: 'subscribers', label: 'Newsletter Subscribers', icon: Mail },
  { key: 'contact', label: 'Contact Information', icon: Phone },
  { key: 'social', label: 'Social Media Links', icon: Share2 },
  { key: 'website', label: 'Website Settings', icon: Settings },
  { key: 'account', label: 'Account Settings', icon: UserCog },
];

export function AdminPortalPage() {
  const { loading, authenticated, authorised, admin, system, login, logout, checkSession } =
    useAuth();
  const { refreshSiteData } = useSiteData();
  const { theme, toggleTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<AdminSectionKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Overview stats
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [cloudinaryReady, setCloudinaryReady] = useState<boolean>(true);

  const loadOverview = useCallback(async () => {
    if (!authenticated || !authorised) return;
    try {
      const res = await apiFetch<{
        stats: AdminOverviewStats;
        services: { databaseConnected: boolean; cloudinaryConfigured: boolean };
      }>('/api/admin/overview');
      setOverviewStats(res.stats);
      setCloudinaryReady(res.services.cloudinaryConfigured);
    } catch {
      // Handled by section managers
    }
  }, [authenticated, authorised]);

  useEffect(() => {
    if (authenticated && authorised) {
      void loadOverview();
    }
  }, [authenticated, authorised, loadOverview]);

  const handleGlobalContentUpdated = useCallback(() => {
    void refreshSiteData();
    void loadOverview();
  }, [refreshSiteData, loadOverview]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setLoginError(null);
    try {
      await login(email, password);
      await checkSession();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E24] text-white flex items-center justify-center">
        <SeoHead title="Administration" noIndex />
        <p className="text-sm text-slate-300 tracking-wide">Verifying secure session...</p>
      </div>
    );
  }

  // 1. UNAUTHENTICATED -> SHOW SECURE ADMINISTRATOR LOGIN PAGE
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#060E24] via-[#0A193C] to-[#0F296B] text-white flex flex-col justify-center px-4 py-12">
        <SeoHead title="Administrator Sign In" noIndex />

        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-[#EDD089] font-semibold">
              Global Seekers Chapel · Seeking God
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-white">
              Ministry Administration
            </h1>
            <p className="mt-2 text-xs text-slate-300">
              Restricted portal for authorised pastoral administration only.
            </p>
          </div>

          {/* Honest external service readiness banner if MongoDB or Initial Admin is not configured yet */}
          {(!system.mongoConfigured || !system.dbConnected) && (
            <div className="mb-6 p-4 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-100 text-xs leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>MongoDB Atlas Configuration Required</span>
              </div>
              <p>
                Set <code className="font-mono">MONGODB_URI</code>,{' '}
                <code className="font-mono">SESSION_SECRET</code>,{' '}
                <code className="font-mono">ADMIN_EMAIL</code>, and{' '}
                <code className="font-mono">ADMIN_INITIAL_PASSWORD</code> in your environment
                variables to activate database authentication and CMS storage.
              </p>
            </div>
          )}

          {system.dbConnected && !system.hasAdminAccount && (
            <div className="mb-6 p-4 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-100 text-xs leading-relaxed">
              <p className="font-semibold text-amber-300 mb-1">
                Initial Administrator Account Pending
              </p>
              <p>
                MongoDB Atlas is connected, but no administrator record exists yet. Set{' '}
                <code className="font-mono">ADMIN_EMAIL</code> and{' '}
                <code className="font-mono">ADMIN_INITIAL_PASSWORD</code> (min 10 chars) and restart
                the server, or run <code className="font-mono">npm run setup-admin</code>.
              </p>
            </div>
          )}

          <div className="p-7 sm:p-8 rounded-2xl bg-[#081533]/90 border border-white/15 shadow-2xl">
            {loginError && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-950/70 border border-red-500/40 text-xs text-red-200">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-slate-200 mb-1.5"
                >
                  Administrator Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-[#060E24] text-sm text-white placeholder:text-slate-500"
                  placeholder="admin@yourdomain.com"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-slate-200 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-[#060E24] text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={signingIn}
                className="w-full py-3 rounded-lg bg-[#C6922C] hover:bg-[#B38222] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Lock className="w-4 h-4" />
                <span>{signingIn ? 'Signing In...' : 'Sign In to Dashboard'}</span>
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED BUT NOT AUTHORISED -> DENY ACCESS
  if (!authorised || !admin) {
    return (
      <div className="min-h-screen bg-[#060E24] text-white flex items-center justify-center p-6">
        <SeoHead title="Access Denied" noIndex />
        <div className="max-w-md w-full p-8 rounded-2xl border border-red-500/30 bg-[#0A193C] text-center">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h1 className="font-serif text-2xl font-semibold">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-300">
            Your session is authenticated, but this account is not authorised to manage website
            content.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-6 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const currentNav = SIDEBAR_ITEMS.find((i) => i.key === activeSection) || SIDEBAR_ITEMS[0];

  // 3. AUTHENTICATED & AUTHORISED -> COMPLETE ADMIN CMS WORKSPACE
  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#060E24] text-slate-900 dark:text-slate-100">
      <SeoHead title={`${currentNav.label} – Ministry CMS`} noIndex />

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 bg-[#07122B] text-slate-200 border-r border-white/10 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <p className="font-serif text-lg font-semibold text-white leading-none">
              Global Seekers CMS
            </p>
            <p className="text-[11px] text-[#DDB04F] mt-1">Prophet Victor A.Y.</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveSection(item.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F296B] text-white font-semibold border border-[#C6922C]/40'
                    : 'text-slate-300 hover:bg-white/6 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#DDB04F]' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-red-300 hover:bg-red-950/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on Left, Theme + View Site on Right */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0A193C]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-white/15 cursor-pointer"
              aria-label="Open admin menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
              <span>CMS</span>
              <span className="mx-2">/</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                {currentNav.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-300">
              {admin.displayName}
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-white/15 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#DDB04F]" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <span>View Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Active Section Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {!cloudinaryReady && (
            <div className="mb-6 p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Cloudinary Media Storage Not Configured Yet</p>
                <p className="mt-0.5">
                  Text updates save to MongoDB Atlas normally, but image uploads require{' '}
                  <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{' '}
                  <code className="font-mono">CLOUDINARY_API_KEY</code>, and{' '}
                  <code className="font-mono">CLOUDINARY_API_SECRET</code> in your environment
                  variables.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-white">
                  Welcome, {admin.displayName}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Manage every photograph, slide, sermon, programme, article, and private prayer
                  request from one place.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Active Hero Slides',
                    val: overviewStats?.activeSlides ?? 0,
                    sub: `${overviewStats?.totalSlides ?? 0} total slides`,
                    target: 'slider' as AdminSectionKey,
                  },
                  {
                    label: 'Published Sermons',
                    val: overviewStats?.publishedSermons ?? 0,
                    sub: `${overviewStats?.totalSermons ?? 0} total messages`,
                    target: 'sermons' as AdminSectionKey,
                  },
                  {
                    label: 'Upcoming Programmes',
                    val: overviewStats?.upcomingEvents ?? 0,
                    sub: `${overviewStats?.totalEvents ?? 0} total events`,
                    target: 'events' as AdminSectionKey,
                  },
                  {
                    label: 'Pending Prayer Requests',
                    val: overviewStats?.pendingPrayers ?? 0,
                    sub: `${overviewStats?.totalPrayers ?? 0} total received`,
                    target: 'prayers' as AdminSectionKey,
                  },
                  {
                    label: 'Published Articles',
                    val: overviewStats?.publishedBlogPosts ?? 0,
                    sub: `${overviewStats?.totalBlogPosts ?? 0} total articles`,
                    target: 'blog' as AdminSectionKey,
                  },
                  {
                    label: 'Gallery Photographs',
                    val: overviewStats?.totalGallery ?? 0,
                    sub: `${overviewStats?.totalMedia ?? 0} Cloudinary assets`,
                    target: 'gallery' as AdminSectionKey,
                  },
                  {
                    label: 'Approved Testimonies',
                    val: overviewStats?.publishedTestimonies ?? 0,
                    sub: `${overviewStats?.totalTestimonies ?? 0} total recorded`,
                    target: 'testimonies' as AdminSectionKey,
                  },
                  {
                    label: 'Pending Enquiries & Invites',
                    val: overviewStats?.pendingInquiries ?? 0,
                    sub: 'Contact & Preaching Invitations',
                    target: 'contact' as AdminSectionKey,
                  },
                  {
                    label: 'Active Subscribers',
                    val: overviewStats?.activeSubscribers ?? 0,
                    sub: 'Newsletter & Updates List',
                    target: 'subscribers' as AdminSectionKey,
                  },
                ].map((card) => (
                  <button
                    key={card.label}
                    type="button"
                    onClick={() => setActiveSection(card.target)}
                    className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] text-left hover:border-[#C6922C]/60 transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {card.label}
                    </p>
                    <p className="mt-2 font-mono tabular-nums text-3xl font-semibold text-[#0F296B] dark:text-white">
                      {card.val}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.sub}</p>
                  </button>
                ))}
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C]">
                <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-white">
                  Quick Ministry Actions
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSection('profile')}
                    className="px-4 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer"
                  >
                    Upload / Update Pastor Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('slider')}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                  >
                    Manage Homepage Image Slider
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('sermons')}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                  >
                    Publish New Sermon
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('events')}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                  >
                    Add Upcoming Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('prayers')}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                  >
                    Review Private Prayer Requests
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <ProfileManager mode="profile" onUpdated={handleGlobalContentUpdated} />
          )}
          {activeSection === 'about' && (
            <ProfileManager mode="about" onUpdated={handleGlobalContentUpdated} />
          )}
          {activeSection === 'homepage' && (
            <HomepageManager onUpdated={handleGlobalContentUpdated} />
          )}
          {activeSection === 'slider' && <SliderManager onUpdated={handleGlobalContentUpdated} />}
          {activeSection === 'sermons' && <SermonsManager onUpdated={handleGlobalContentUpdated} />}
          {activeSection === 'events' && <EventsManager onUpdated={handleGlobalContentUpdated} />}
          {activeSection === 'books' && <BooksManager onUpdated={handleGlobalContentUpdated} />}
          {activeSection === 'gallery' && <GalleryManager onUpdated={handleGlobalContentUpdated} />}
          {activeSection === 'testimonies' && (
            <TestimoniesManager onUpdated={handleGlobalContentUpdated} />
          )}
          {activeSection === 'blog' && <BlogManager onUpdated={handleGlobalContentUpdated} />}
          {activeSection === 'prayers' && (
            <PrayerRequestsManager onUpdated={handleGlobalContentUpdated} />
          )}
          {activeSection === 'subscribers' && (
            <NewsletterSubscribersManager onUpdated={handleGlobalContentUpdated} />
          )}
          {activeSection === 'contact' && (
            <SettingsSectionManager section="contact" onUpdated={handleGlobalContentUpdated} />
          )}
          {activeSection === 'social' && (
            <SettingsSectionManager section="social" onUpdated={handleGlobalContentUpdated} />
          )}
          {activeSection === 'website' && (
            <SettingsSectionManager section="website" onUpdated={handleGlobalContentUpdated} />
          )}
          {activeSection === 'account' && <AccountSettingsManager />}
        </main>
      </div>
    </div>
  );
}
