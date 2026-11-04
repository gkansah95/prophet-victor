/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { SeoHead } from './components/common/SeoHead';
import { PublicLayout } from './components/public/PublicLayout';
import { AuthProvider } from './context/AuthContext';
import { SiteDataProvider } from './context/SiteDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminPortalPage } from './pages/admin/AdminPortalPage';
import { AboutPage } from './pages/public/AboutPage';
import { BlogPage } from './pages/public/BlogPage';
import { BooksPage } from './pages/public/BooksPage';
import { ContactPage } from './pages/public/ContactPage';
import { EventsPage } from './pages/public/EventsPage';
import { GalleryPage } from './pages/public/GalleryPage';
import { HomePage } from './pages/public/HomePage';
import { PrayerRequestsPage } from './pages/public/PrayerRequestsPage';
import { SermonsPage } from './pages/public/SermonsPage';
import { TestimoniesPage } from './pages/public/TestimoniesPage';

function NotFoundPage() {
  return (
    <section className="py-24 px-4 text-center">
      <SeoHead title="Page Not Found" noIndex />
      <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
        404 · Page Not Found
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-slate-900 dark:text-white">
        This Page Could Not Be Found
      </h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
        The link you followed may have changed or been moved.
      </p>
      <div className="mt-8">
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-sm font-semibold"
        >
          Return to Homepage
        </Link>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SiteDataProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Private Administrator CMS Route (/admin – No public links anywhere) */}
              <Route path="/admin/*" element={<AdminPortalPage />} />

              {/* Public Ministry Website Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/sermons" element={<SermonsPage />} />
                <Route path="/sermons/:slug" element={<SermonsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:slug" element={<EventsPage />} />
                <Route path="/books" element={<BooksPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/testimonies" element={<TestimoniesPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPage />} />
                <Route path="/prayer-requests" element={<PrayerRequestsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SiteDataProvider>
    </ThemeProvider>
  );
}
