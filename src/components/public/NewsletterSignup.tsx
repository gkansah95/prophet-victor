import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { apiFetch, ApiError } from '../../lib/api';

interface NewsletterSignupProps {
  variant?: 'footer' | 'standalone';
  className?: string;
}

export function NewsletterSignup({ variant = 'footer', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Spam honeypot detection
    if (honeypot) {
      setStatus('success');
      setMessage('Thank you for subscribing!');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus('error');
      setMessage('Please provide a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await apiFetch<{ success: boolean; message: string }>('/api/public/newsletter', {
        method: 'POST',
        body: JSON.stringify({
          email: trimmedEmail,
          fullName: fullName.trim() || undefined,
        }),
      });

      setStatus('success');
      setMessage(response.message || 'Blessings! You have successfully subscribed to ministry updates.');
      setEmail('');
      setFullName('');
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiError) {
        setMessage(err.message);
      } else {
        setMessage('Unable to process your subscription right now. Please try again later.');
      }
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setMessage('');
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#0A193C] via-[#081534] to-[#040B1D] text-white p-6 sm:p-8 lg:p-10 shadow-2xl ${className}`}
    >
      {/* Decorative background radiance */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#C6922C]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#0F296B]/30 blur-3xl"
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Header & Spiritual Invitation */}
          <div className="lg:col-span-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6922C]/15 border border-[#C6922C]/30 text-[#DDB04F] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seeking God · Ministry Newsletter</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
              Receive Prophetic Declarations & Ministry Updates
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              Stay connected with Global Seekers Chapel and Prophet Victor A.Y. Receive uplifting
              devotionals, sermon alerts, and programme notices directly in your inbox.
            </p>

            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Zero spam. Pure spiritual encouragement. Unsubscribe anytime.
            </p>
          </div>

          {/* Form / Feedback Area */}
          <div className="lg:col-span-6">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-center space-y-3 backdrop-blur-sm"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-xl font-semibold text-white">Grace & Peace Be Multiplied!</h4>
                  <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                    {message}
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-2 inline-flex items-center text-xs font-medium text-[#DDB04F] hover:text-white transition-colors cursor-pointer underline underline-offset-4"
                  >
                    Subscribe another email address
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="newsletter-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-3"
                  noValidate
                >
                  {/* Honeypot field for bot protection (hidden from humans) */}
                  <div style={{ display: 'none' }} aria-hidden="true">
                    <label htmlFor="website_honeypot">Leave blank</label>
                    <input
                      type="text"
                      id="website_honeypot"
                      name="website_honeypot"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <label htmlFor="newsletter_name" className="sr-only">
                        Your Full Name (Optional)
                      </label>
                      <input
                        type="text"
                        id="newsletter_name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name (optional)"
                        disabled={status === 'loading'}
                        className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 focus:bg-[#060E24] focus:border-[#C6922C] focus:ring-2 focus:ring-[#C6922C]/30 text-white placeholder:text-slate-400 text-sm transition-all outline-none disabled:opacity-50"
                      />
                    </div>

                    <div className="sm:col-span-7">
                      <label htmlFor="newsletter_email" className="sr-only">
                        Your Email Address
                      </label>
                      <div className="relative">
                        <Mail
                          aria-hidden="true"
                          className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                        <input
                          type="email"
                          id="newsletter_email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Your email address *"
                          disabled={status === 'loading'}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 focus:bg-[#060E24] focus:border-[#C6922C] focus:ring-2 focus:ring-[#C6922C]/30 text-white placeholder:text-slate-400 text-sm transition-all outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {status === 'error' && (
                    <div
                      role="alert"
                      className="flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-200 text-xs animate-shake"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{message}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <p className="text-[11px] text-slate-400">
                      By subscribing, you agree to receive email communications from Global Seekers Chapel.
                    </p>

                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C6922C] to-[#DDB04F] hover:from-[#B38222] hover:to-[#C6922C] text-[#0A193C] text-xs sm:text-sm font-bold shadow-lg shadow-[#C6922C]/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Subscribing...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Subscribe to Updates</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
