import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { PageTransition } from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { useSiteData } from '../../context/SiteDataContext';
import { apiFetch } from '../../lib/api';

export function ContactPage() {
  const { siteData } = useSiteData();
  const { settings, profile } = siteData;

  const [formMode, setFormMode] = useState<'contact' | 'invitation'>('contact');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    ministryOrOrganization: '',
    proposedDate: '',
    eventLocation: '',
    subject: 'Preaching / Ministry Invitation',
    message: '',
  });

  const hasContactDetails = Boolean(
    settings.contactEmail ||
      settings.contactPhone ||
      settings.secondaryPhone ||
      settings.physicalAddress ||
      settings.cityCountry ||
      settings.officeHours ||
      (settings.serviceTimes && settings.serviceTimes.length > 0)
  );

  const activeSocials = Object.entries(settings.socialLinks || {}).filter(([, val]) =>
    Boolean(val && val.trim())
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await apiFetch<{ message: string }>('/api/public/contact', {
        method: 'POST',
        body: JSON.stringify(contactForm),
      });
      setSuccessMsg(res.message);
      setContactForm({ fullName: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await apiFetch<{ message: string }>('/api/public/invitations', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });
      setSuccessMsg(res.message);
      setInviteForm({
        fullName: '',
        email: '',
        phone: '',
        ministryOrOrganization: '',
        proposedDate: '',
        eventLocation: '',
        subject: 'Preaching / Ministry Invitation',
        message: '',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit ministry invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <SeoHead
        title="Contact & Ministry Invitations"
        description={`Contact ${profile.ministryName || 'Global Seekers Chapel'} or extend a ministry invitation to ${profile.fullName || 'Prophet Victor A.Y.'}.`}
      />

      <section className="bg-gradient-to-b from-[#081538] to-[#0F296B] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-[#EDD089] font-medium">
            {profile.ministryName || 'Global Seekers Chapel'} · {profile.slogan || 'Seeking God'}
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
            Contact & Invitations
          </h1>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-[#060E24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Official Administrator-Managed Contact Details */}
            <div className="lg:col-span-5 space-y-8">
              <div className="p-7 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                  Ministry Information
                </h2>

                {hasContactDetails ? (
                  <div className="mt-6 space-y-5 text-sm text-slate-700 dark:text-slate-200">
                    {(settings.physicalAddress || settings.cityCountry) && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-[#C6922C] shrink-0 mt-1" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">Address</p>
                          {settings.physicalAddress && <p>{settings.physicalAddress}</p>}
                          {settings.cityCountry && <p>{settings.cityCountry}</p>}
                        </div>
                      </div>
                    )}

                    {(settings.contactPhone || settings.secondaryPhone) && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-[#C6922C] shrink-0 mt-1" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">Telephone</p>
                          {settings.contactPhone && (
                            <p>
                              <a href={`tel:${settings.contactPhone}`} className="hover:underline">
                                {settings.contactPhone}
                              </a>
                            </p>
                          )}
                          {settings.secondaryPhone && (
                            <p>
                              <a
                                href={`tel:${settings.secondaryPhone}`}
                                className="hover:underline"
                              >
                                {settings.secondaryPhone}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {settings.contactEmail && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-[#C6922C] shrink-0 mt-1" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">Email</p>
                          <a href={`mailto:${settings.contactEmail}`} className="hover:underline">
                            {settings.contactEmail}
                          </a>
                        </div>
                      </div>
                    )}

                    {settings.officeHours && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-[#C6922C] shrink-0 mt-1" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            Office Hours
                          </p>
                          <p>{settings.officeHours}</p>
                        </div>
                      </div>
                    )}

                    {settings.serviceTimes && settings.serviceTimes.length > 0 && (
                      <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                        <p className="font-semibold text-slate-900 dark:text-white mb-2">
                          Service Schedule
                        </p>
                        <ul className="space-y-1.5">
                          {settings.serviceTimes.map((item, idx) => (
                            <li key={idx} className="text-xs sm:text-sm">
                              <span className="font-medium">{item.label}:</span> {item.day} ·{' '}
                              {item.time}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Direct contact channels for {profile.ministryName || 'Global Seekers Chapel'}{' '}
                    are managed via the forms on this page. Select General Enquiry or Preaching
                    Invitation to reach the ministry office.
                  </p>
                )}

                {activeSocials.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10">
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
                      Official Channels
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs font-medium">
                      {activeSocials.map(([key, url]) => (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0F296B] dark:text-[#DDB04F] hover:underline capitalize"
                        >
                          {key === 'twitterX' ? 'X (Twitter)' : key}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Validated General Enquiry & Preaching Invitation Forms */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-[#060E24] mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode('contact');
                      setSuccessMsg(null);
                      setErrorMsg(null);
                    }}
                    className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      formMode === 'contact'
                        ? 'bg-white dark:bg-[#0F296B] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    General Enquiry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode('invitation');
                      setSuccessMsg(null);
                      setErrorMsg(null);
                    }}
                    className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      formMode === 'invitation'
                        ? 'bg-white dark:bg-[#0F296B] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Preaching Invitation
                  </button>
                </div>

                {successMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-sm text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-3 text-sm text-red-700 dark:text-red-200">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {formMode === 'contact' ? (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={2}
                          value={contactForm.fullName}
                          onChange={(e) =>
                            setContactForm((p) => ({ ...p, fullName: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) =>
                            setContactForm((p) => ({ ...p, email: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Telephone (Optional)
                        </label>
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) =>
                            setContactForm((p) => ({ ...p, phone: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Subject *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={2}
                          value={contactForm.subject}
                          onChange={(e) =>
                            setContactForm((p) => ({ ...p, subject: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                        Message *
                      </label>
                      <textarea
                        required
                        minLength={10}
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm((p) => ({ ...p, message: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-7 py-3 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? 'Sending Message...' : 'Send Enquiry'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleInviteSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Contact Person Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={inviteForm.fullName}
                          onChange={(e) =>
                            setInviteForm((p) => ({ ...p, fullName: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Inviting Church / Organisation *
                        </label>
                        <input
                          type="text"
                          required
                          value={inviteForm.ministryOrOrganization}
                          onChange={(e) =>
                            setInviteForm((p) => ({
                              ...p,
                              ministryOrOrganization: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Official Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={inviteForm.email}
                          onChange={(e) =>
                            setInviteForm((p) => ({ ...p, email: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Direct Telephone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={inviteForm.phone}
                          onChange={(e) =>
                            setInviteForm((p) => ({ ...p, phone: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Proposed Date(s) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 14–16 March 2027"
                          value={inviteForm.proposedDate}
                          onChange={(e) =>
                            setInviteForm((p) => ({ ...p, proposedDate: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Venue, City & Country *
                        </label>
                        <input
                          type="text"
                          required
                          value={inviteForm.eventLocation}
                          onChange={(e) =>
                            setInviteForm((p) => ({ ...p, eventLocation: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                        Programme Details & Theme *
                      </label>
                      <textarea
                        required
                        minLength={15}
                        rows={5}
                        value={inviteForm.message}
                        onChange={(e) =>
                          setInviteForm((p) => ({ ...p, message: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                        placeholder="Describe the programme, expected sessions, and pastoral details..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-7 py-3 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? 'Submitting Invitation...' : 'Submit Preaching Invitation'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
