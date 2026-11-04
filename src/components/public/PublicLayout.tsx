import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useSiteData } from '../../context/SiteDataContext';
import { useTheme } from '../../context/ThemeContext';

const PUBLIC_NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Sermons', to: '/sermons' },
  { label: 'Events', to: '/events' },
  { label: 'Books', to: '/books' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Testimonies', to: '/testimonies' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
];

export function PublicLayout() {
  const { siteData } = useSiteData();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const { settings, profile } = siteData;
  const ministryName = profile.ministryName || settings.siteName || 'Global Seekers Chapel';
  const pastorName = profile.fullName || settings.pastorName || 'Prophet Victor A.Y.';
  const slogan = profile.slogan || settings.slogan || 'Seeking God';

  const activeSocialEntries = Object.entries(settings.socialLinks || {}).filter(([, val]) =>
    Boolean(val && val.trim())
  );

  const hasContactDetails = Boolean(
    settings.contactEmail ||
      settings.contactPhone ||
      settings.secondaryPhone ||
      settings.physicalAddress ||
      settings.cityCountry
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#060E24] dark:text-slate-100 transition-colors duration-300">
      {/* Top Bar Contract: Zone 1 Brand | Zone 2 Single-Line Nav | Zone 3 Theme + Primary CTA */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#060E24]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#0F296B] dark:text-white whitespace-nowrap shrink-0"
          >
            {ministryName}
          </Link>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            {PUBLIC_NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[#0F296B] dark:text-[#DDB04F] font-semibold after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:bg-[#C6922C]'
                      : 'hover:text-[#0F296B] dark:hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Theme Toggle + 1 Primary Action (No Admin/Login button anywhere) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-10 h-10 rounded-lg border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#DDB04F]" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/prayer-requests"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Prayer Request
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="xl:hidden w-10 h-10 rounded-lg border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile & Tablet Slide-Down Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] shadow-xl"
            >
              <nav
                aria-label="Mobile navigation"
                className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-1.5"
              >
                {[...PUBLIC_NAV_LINKS, { label: 'Prayer Requests', to: '/prayer-requests' }].map(
                  (item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#0F296B]/8 dark:bg-white/10 text-[#0F296B] dark:text-[#DDB04F] font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  )
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Public Viewport */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Institutional Royal Navy Footer (Zero fictional info, Zero admin links) */}
      <footer className="bg-[#07122B] text-slate-300 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-5">
              <p className="text-xs uppercase tracking-widest text-[#DDB04F] font-medium">
                {slogan}
              </p>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-white">
                {ministryName}
              </h2>
              <p className="mt-1 text-sm text-slate-300 font-medium">{pastorName}</p>

              {profile.shortIntroduction && (
                <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-md line-clamp-3">
                  {profile.shortIntroduction}
                </p>
              )}

              {activeSocialEntries.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
                  {activeSocialEntries.map(([platform, link], idx) => (
                    <span key={platform} className="inline-flex items-center gap-4">
                      {idx > 0 && <span aria-hidden="true" className="text-white/25">·</span>}
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="capitalize hover:text-[#DDB04F] transition-colors"
                      >
                        {platform === 'twitterX' ? 'X (Twitter)' : platform}
                      </a>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ministry Pages */}
            <div className="lg:col-span-4">
              <h3 className="font-sans text-xs uppercase tracking-widest text-white/80 font-semibold">
                Ministry Navigation
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
                {[...PUBLIC_NAV_LINKS, { label: 'Prayer Requests', to: '/prayer-requests' }].map(
                  (item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className="text-slate-400 hover:text-[#DDB04F] transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Contact & Fellowship Column */}
            <div className="lg:col-span-3">
              <h3 className="font-sans text-xs uppercase tracking-widest text-white/80 font-semibold">
                Connect & Prayer
              </h3>
              {hasContactDetails ? (
                <div className="mt-4 space-y-2 text-sm text-slate-400">
                  {settings.physicalAddress && <p>{settings.physicalAddress}</p>}
                  {settings.cityCountry && <p>{settings.cityCountry}</p>}
                  {settings.contactPhone && (
                    <p>
                      <a href={`tel:${settings.contactPhone}`} className="hover:text-white">
                        {settings.contactPhone}
                      </a>
                    </p>
                  )}
                  {settings.contactEmail && (
                    <p>
                      <a href={`mailto:${settings.contactEmail}`} className="hover:text-white">
                        {settings.contactEmail}
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                  Reach out for prayer requests, pastoral enquiries, or ministry invitations.
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/prayer-requests"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-[#C6922C] hover:bg-[#B38222] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Submit Prayer Request
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()}{' '}
              {settings.footerCopyrightText ||
                `${pastorName} · ${ministryName}. All rights reserved.`}
            </p>
            <p className="text-slate-500">{ministryName} · {slogan}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
