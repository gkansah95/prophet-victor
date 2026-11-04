import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { PageTransition } from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { apiFetch } from '../../lib/api';

export function PrayerRequestsPage() {
  const [form, setForm] = useState({
    requesterName: '',
    email: '',
    phone: '',
    subject: '',
    requestText: '',
    isConfidential: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiFetch<{ message: string }>('/api/public/prayer-requests', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccessMsg(res.message || 'Your prayer request has been received privately.');
      setForm({
        requesterName: '',
        email: '',
        phone: '',
        subject: '',
        requestText: '',
        isConfidential: true,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to submit prayer request. Please try again later.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <SeoHead
        title="Submit a Prayer Request"
        description="Submit a confidential prayer request to Prophet Victor A.Y. and Global Seekers Chapel."
      />

      <section className="bg-gradient-to-b from-[#081538] to-[#0F296B] text-white py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-widest text-[#EDD089] font-medium">
            Global Seekers Chapel · Seeking God
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
            Prayer Requests
          </h1>
          <p className="mt-4 text-base text-slate-200 leading-relaxed max-w-xl mx-auto">
            Share your prayer need below. Every submission is kept strictly confidential and
            accessible only to authorised pastoral leadership.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-[#060E24]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
              <Lock className="w-3.5 h-3.5 text-[#C6922C]" />
              <span>Private & Confidential Submission</span>
            </div>

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-sm text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Prayer Request Submitted</p>
                  <p className="mt-0.5">{successMsg}</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-3 text-sm text-red-700 dark:text-red-200">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Submission Could Not Be Completed</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="pr-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Your Name *
                </label>
                <input
                  id="pr-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={140}
                  value={form.requesterName}
                  onChange={(e) => setForm((p) => ({ ...p, requesterName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm text-slate-900 dark:text-white"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pr-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Email Address (Optional)
                  </label>
                  <input
                    id="pr-email"
                    type="email"
                    maxLength={180}
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm text-slate-900 dark:text-white"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pr-phone"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Telephone (Optional)
                  </label>
                  <input
                    id="pr-phone"
                    type="tel"
                    maxLength={50}
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm text-slate-900 dark:text-white"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="pr-subject"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Prayer Focus / Subject (Optional)
                </label>
                <input
                  id="pr-subject"
                  type="text"
                  maxLength={180}
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm text-slate-900 dark:text-white"
                  placeholder="e.g. Family, Healing, Spiritual Growth"
                />
              </div>

              <div>
                <label
                  htmlFor="pr-body"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Prayer Request *
                </label>
                <textarea
                  id="pr-body"
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={6}
                  value={form.requestText}
                  onChange={(e) => setForm((p) => ({ ...p, requestText: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm text-slate-900 dark:text-white leading-relaxed"
                  placeholder="Write your prayer request here..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-7 py-3 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting Confidentially...' : 'Submit Prayer Request'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
