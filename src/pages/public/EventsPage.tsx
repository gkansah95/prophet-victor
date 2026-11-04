import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, ExternalLink, MapPin } from 'lucide-react';
import { ManagedImage } from '../../components/common/ManagedImage';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { apiFetch } from '../../lib/api';
import { formatMinistryDate } from '../../lib/media';
import type { EventItem } from '../../types/cms';

export function EventsPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [pastEvents, setPastEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(true);

  // Internal registration form state
  const [regForm, setRegForm] = useState({ fullName: '', email: '', phone: '', message: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setRegSuccess(null);
    setRegError(null);

    if (slug) {
      apiFetch<{ event: EventItem }>(`/api/public/events/${encodeURIComponent(slug)}`)
        .then((res) => {
          if (active) setSelectedEvent(res.event);
        })
        .catch(() => {
          if (active) setSelectedEvent(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setSelectedEvent(null);
      apiFetch<{ events: EventItem[]; pastEvents: EventItem[] }>('/api/public/events')
        .then((res) => {
          if (active) {
            setUpcomingEvents(res.events || []);
            setPastEvents(res.pastEvents || []);
          }
        })
        .catch(() => {
          if (active) {
            setUpcomingEvents([]);
            setPastEvents([]);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [slug]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setRegSubmitting(true);
    setRegError(null);
    setRegSuccess(null);

    try {
      const res = await apiFetch<{ message: string }>(
        `/api/public/events/${selectedEvent._id}/register`,
        {
          method: 'POST',
          body: JSON.stringify(regForm),
        }
      );
      setRegSuccess(res.message || 'Registration received.');
      setRegForm({ fullName: '', email: '', phone: '', message: '' });
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Unable to submit registration.');
    } finally {
      setRegSubmitting(false);
    }
  };

  if (slug) {
    return (
      <PageTransition>
        <SeoHead
          title={selectedEvent ? selectedEvent.title : 'Events & Programmes'}
          description={selectedEvent?.description?.slice(0, 160)}
          imageUrl={selectedEvent?.image?.url}
        />

        <section className="py-14 sm:py-20 bg-white dark:bg-[#060E24]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0F296B] dark:text-[#DDB04F] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events & Programmes</span>
            </Link>

            {loading ? (
              <div className="mt-8 space-y-4 animate-pulse">
                <div className="h-10 w-2/3 bg-slate-200 dark:bg-white/10 rounded" />
                <div className="aspect-[16/9] w-full bg-slate-200 dark:bg-white/10 rounded-xl" />
              </div>
            ) : !selectedEvent ? (
              <div className="mt-10 p-10 rounded-xl border border-slate-200 dark:border-white/10 text-center">
                <h1 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                  Programme Not Found
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  This programme may have been unpublished or removed.
                </p>
              </div>
            ) : (
              <article className="mt-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#A6761B] dark:text-[#DDB04F] font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{formatMinistryDate(selectedEvent.eventDate)}</span>
                  {selectedEvent.endDate && (
                    <>
                      <span aria-hidden="true">–</span>
                      <span>{formatMinistryDate(selectedEvent.endDate)}</span>
                    </>
                  )}
                  {selectedEvent.eventTime && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{selectedEvent.eventTime}</span>
                    </>
                  )}
                </div>

                <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 dark:text-white">
                  {selectedEvent.title}
                </h1>

                {selectedEvent.location && (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-[#C6922C]" />
                    <span>{selectedEvent.location}</span>
                  </p>
                )}

                {selectedEvent.image?.url && (
                  <ManagedImage
                    url={selectedEvent.image.url}
                    alt={selectedEvent.image.alt || selectedEvent.title}
                    width={1200}
                    className="mt-8 aspect-[16/9] w-full rounded-xl border border-slate-200 dark:border-white/10"
                  />
                )}

                <div className="mt-8 max-w-prose text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedEvent.description}
                </div>

                {selectedEvent.registrationLink && !selectedEvent.isArchived && (
                  <div className="mt-8">
                    <a
                      href={selectedEvent.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#C6922C] hover:bg-[#B38222] text-white text-sm font-semibold transition-colors"
                    >
                      <span>Register for Programme</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {selectedEvent.enableInternalRegistration && !selectedEvent.isArchived && (
                  <div className="mt-12 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                    <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                      Programme Registration
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Complete the form below to register your attendance.
                    </p>

                    {regSuccess ? (
                      <div className="mt-5 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-sm text-emerald-800 dark:text-emerald-200">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{regSuccess}</span>
                      </div>
                    ) : (
                      <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
                        {regError && (
                          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-200">
                            {regError}
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={regForm.fullName}
                              onChange={(e) =>
                                setRegForm((p) => ({ ...p, fullName: e.target.value }))
                              }
                              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              required
                              value={regForm.email}
                              onChange={(e) =>
                                setRegForm((p) => ({ ...p, email: e.target.value }))
                              }
                              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                            Telephone (Optional)
                          </label>
                          <input
                            type="tel"
                            value={regForm.phone}
                            onChange={(e) =>
                              setRegForm((p) => ({ ...p, phone: e.target.value }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={regSubmitting}
                          className="px-6 py-3 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
                        >
                          {regSubmitting ? 'Submitting Registration...' : 'Confirm Registration'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </article>
            )}
          </div>
        </section>
      </PageTransition>
    );
  }

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <PageTransition>
      <SeoHead
        title="Events & Programmes"
        description="Upcoming services, conferences, and ministry programmes with Prophet Victor A.Y. and Global Seekers Chapel."
      />

      <section className="bg-gradient-to-b from-[#081538] to-[#0F296B] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-[#EDD089] font-medium">
            Gatherings & Conferences
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
            Events & Programmes
          </h1>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-[#060E24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(upcomingEvents.length > 0 || pastEvents.length > 0) && (
            <div className="mb-10 inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0A193C]">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'upcoming'
                    ? 'bg-white dark:bg-[#0F296B] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Upcoming ({upcomingEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'past'
                    ? 'bg-white dark:bg-[#0F296B] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Past Programmes ({pastEvents.length})
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse"
                />
              ))}
            </div>
          ) : displayedEvents.length === 0 ? (
            <div className="py-16 px-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C] text-center max-w-xl mx-auto">
              <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                {activeTab === 'upcoming'
                  ? 'No Upcoming Programmes Announced Yet'
                  : 'No Archived Programmes'}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {activeTab === 'upcoming'
                  ? 'Check back soon for upcoming services, conferences, and special ministry gatherings.'
                  : 'Completed ministry programmes will be listed here.'}
              </p>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedEvents.map((ev) => (
                <StaggerItem key={ev._id}>
                  <Link
                    to={`/events/${ev.slug}`}
                    className="group flex flex-col h-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] overflow-hidden hover:border-[#C6922C]/60 transition-colors"
                  >
                    {ev.image?.url && (
                      <ManagedImage
                        url={ev.image.url}
                        alt={ev.image.alt || ev.title}
                        width={720}
                        className="aspect-[16/10] w-full"
                        imgClassName="w-full h-full object-cover group-hover:scale-105"
                      />
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#A6761B] dark:text-[#DDB04F] font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatMinistryDate(ev.eventDate)}</span>
                        {ev.eventTime && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{ev.eventTime}</span>
                          </>
                        )}
                      </div>
                      <h2 className="mt-2.5 font-serif text-xl font-semibold text-slate-900 dark:text-white group-hover:text-[#0F296B] dark:group-hover:text-[#DDB04F] transition-colors">
                        {ev.title}
                      </h2>
                      {ev.location && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {ev.location}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
