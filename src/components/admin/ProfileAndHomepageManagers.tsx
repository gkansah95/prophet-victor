import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type {
  EventItem,
  HomepageSectionData,
  PastorProfileData,
  SermonItem,
} from '../../types/cms';
import { CloudinaryImageInput } from './CloudinaryImageInput';

interface ProfileManagerProps {
  mode: 'profile' | 'about';
  onUpdated: () => void;
}

export function ProfileManager({ mode, onUpdated }: ProfileManagerProps) {
  const [profile, setProfile] = useState<PastorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ profile: PastorProfileData }>('/api/admin/profile')
      .then((res) => setProfile(res.profile))
      .catch((err) =>
        setFeedback({
          type: 'err',
          text: err instanceof Error ? err.message : 'Unable to load pastor profile.',
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setFeedback(null);

    try {
      const res = await apiFetch<{ profile: PastorProfileData; message: string }>(
        '/api/admin/profile',
        {
          method: 'PUT',
          body: JSON.stringify(profile),
        }
      );
      setProfile(res.profile);
      setFeedback({ type: 'ok', text: res.message || 'Profile saved.' });
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <div className="h-64 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
          {mode === 'profile' ? 'Pastor Profile Management' : 'About the Pastor Content'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Manage Prophet Victor A.Y.’s official portrait, biography, ministry information, vision,
          and mission.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] space-y-6">
        <CloudinaryImageInput
          label="Main Profile Photograph (Prophet Victor A.Y.)"
          folder="gsc/profile"
          aspectClass="aspect-[4/5]"
          value={profile.profilePhoto}
          onChange={(img) => setProfile({ ...profile, profilePhoto: img })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Pastor’s Name *
            </label>
            <input
              type="text"
              required
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Ministerial Role / Title (Optional)
            </label>
            <input
              type="text"
              value={profile.ministerialTitle}
              onChange={(e) => setProfile({ ...profile, ministerialTitle: e.target.value })}
              placeholder="e.g. General Overseer / Lead Pastor"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Ministry Name *
            </label>
            <input
              type="text"
              required
              value={profile.ministryName}
              onChange={(e) => setProfile({ ...profile, ministryName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Ministry Slogan *
            </label>
            <input
              type="text"
              required
              value={profile.slogan}
              onChange={(e) => setProfile({ ...profile, slogan: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Short Introduction (Displayed on Homepage & About Lead)
          </label>
          <textarea
            rows={3}
            value={profile.shortIntroduction}
            onChange={(e) => setProfile({ ...profile, shortIntroduction: e.target.value })}
            placeholder="Write a concise pastoral introduction..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Full Biography
          </label>
          <textarea
            rows={8}
            value={profile.fullBiography}
            onChange={(e) => setProfile({ ...profile, fullBiography: e.target.value })}
            placeholder="Enter the complete official biography of Prophet Victor A.Y..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Ministry Information (Global Seekers Chapel)
          </label>
          <textarea
            rows={5}
            value={profile.ministryInformation}
            onChange={(e) => setProfile({ ...profile, ministryInformation: e.target.value })}
            placeholder="Describe Global Seekers Chapel and its spiritual mandate..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Vision Statement
            </label>
            <textarea
              rows={4}
              value={profile.visionStatement}
              onChange={(e) => setProfile({ ...profile, visionStatement: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Mission Statement
            </label>
            <textarea
              rows={4}
              value={profile.missionStatement}
              onChange={(e) => setProfile({ ...profile, missionStatement: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm leading-relaxed"
            />
          </div>
        </div>

        <CloudinaryImageInput
          label="Secondary Ministry Photograph (Optional – Shown on About Page)"
          folder="gsc/profile"
          value={profile.secondaryPhoto}
          onChange={(img) => setProfile({ ...profile, secondaryPhoto: img })}
        />

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
          <label className="inline-flex items-center gap-2.5 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={profile.isPublished}
              onChange={(e) => setProfile({ ...profile, isPublished: e.target.checked })}
              className="w-4 h-4 accent-[#0F296B]"
            />
            <span>Publish Profile Content on Public Website</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </form>
  );
}

export function HomepageManager({ onUpdated }: { onUpdated: () => void }) {
  const [homepage, setHomepage] = useState<HomepageSectionData | null>(null);
  const [sermons, setSermons] = useState<SermonItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<{ homepage: HomepageSectionData }>('/api/admin/homepage'),
      apiFetch<{ sermons: SermonItem[] }>('/api/admin/sermons'),
      apiFetch<{ events: EventItem[] }>('/api/admin/events'),
    ])
      .then(([hRes, sRes, eRes]) => {
        setHomepage(hRes.homepage);
        setSermons((sRes.sermons || []).filter((s) => s.status === 'published'));
        setEvents((eRes.events || []).filter((ev) => ev.status === 'published' && !ev.isArchived));
      })
      .catch((err) =>
        setFeedback({
          type: 'err',
          text: err instanceof Error ? err.message : 'Unable to load homepage settings.',
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homepage) return;
    setSaving(true);
    setFeedback(null);

    try {
      const res = await apiFetch<{ homepage: HomepageSectionData; message: string }>(
        '/api/admin/homepage',
        {
          method: 'PUT',
          body: JSON.stringify(homepage),
        }
      );
      setHomepage(res.homepage);
      setFeedback({ type: 'ok', text: res.message || 'Homepage updated.' });
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save homepage settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !homepage) {
    return <div className="h-64 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse" />;
  }

  const toggleFeaturedId = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

  const visibilityItems: { key: keyof HomepageSectionData['visibility']; label: string }[] = [
    { key: 'showSlider', label: 'Hero Image Slider' },
    { key: 'showAbout', label: 'About the Pastor Section' },
    { key: 'showFeaturedSermons', label: 'Featured Sermons Section' },
    { key: 'showUpcomingEvents', label: 'Upcoming Events Section' },
    { key: 'showBooks', label: 'Books & Publications Section' },
    { key: 'showGallery', label: 'Ministry Gallery Section' },
    { key: 'showTestimonies', label: 'Testimonies Section' },
    { key: 'showBlog', label: 'Blog & Devotionals Section' },
    { key: 'showPrayerRequest', label: 'Prayer Request Call-to-Action' },
    { key: 'showContact', label: 'Contact Summary Section' },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
          Homepage Management
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Customise the welcome message, call-to-action buttons, section headings, visibility, and
          featured items.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Hero Welcome & CTAs */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] space-y-5">
        <h3 className="font-serif text-xl font-semibold text-slate-900 dark:text-white">
          Hero Welcome & Call-to-Action Buttons
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Hero Welcome Message
          </label>
          <textarea
            rows={3}
            value={homepage.heroWelcomeMessage}
            onChange={(e) => setHomepage({ ...homepage, heroWelcomeMessage: e.target.value })}
            placeholder="Write a warm pastoral welcome message for visitors..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Primary CTA Button Label
            </label>
            <input
              type="text"
              value={homepage.heroPrimaryCtaLabel}
              onChange={(e) => setHomepage({ ...homepage, heroPrimaryCtaLabel: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Primary CTA Destination Link
            </label>
            <input
              type="text"
              value={homepage.heroPrimaryCtaLink}
              onChange={(e) => setHomepage({ ...homepage, heroPrimaryCtaLink: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Secondary CTA Button Label
            </label>
            <input
              type="text"
              value={homepage.heroSecondaryCtaLabel}
              onChange={(e) => setHomepage({ ...homepage, heroSecondaryCtaLabel: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Secondary CTA Destination Link
            </label>
            <input
              type="text"
              value={homepage.heroSecondaryCtaLink}
              onChange={(e) => setHomepage({ ...homepage, heroSecondaryCtaLink: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
        </div>

        <CloudinaryImageInput
          label="Optional Hero Ambient Background Image"
          folder="gsc/settings"
          value={homepage.heroBackgroundImage}
          onChange={(img) => setHomepage({ ...homepage, heroBackgroundImage: img })}
        />
      </div>

      {/* Section Visibility Toggles */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] space-y-4">
        <h3 className="font-serif text-xl font-semibold text-slate-900 dark:text-white">
          Homepage Section Visibility
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose which sections appear on the public homepage. Empty dynamic sections also hide
          automatically.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {visibilityItems.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={homepage.visibility[item.key]}
                onChange={(e) =>
                  setHomepage({
                    ...homepage,
                    visibility: { ...homepage.visibility, [item.key]: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-[#0F296B]"
              />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Section Headings & Descriptions */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] space-y-5">
        <h3 className="font-serif text-xl font-semibold text-slate-900 dark:text-white">
          Section Headings & Descriptions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">About Section Heading</label>
            <input
              type="text"
              value={homepage.aboutHeading}
              onChange={(e) => setHomepage({ ...homepage, aboutHeading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Sermons Section Heading</label>
            <input
              type="text"
              value={homepage.sermonsHeading}
              onChange={(e) => setHomepage({ ...homepage, sermonsHeading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Events Section Heading</label>
            <input
              type="text"
              value={homepage.eventsHeading}
              onChange={(e) => setHomepage({ ...homepage, eventsHeading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Gallery Section Heading</label>
            <input
              type="text"
              value={homepage.galleryHeading}
              onChange={(e) => setHomepage({ ...homepage, galleryHeading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              Testimonies Section Heading
            </label>
            <input
              type="text"
              value={homepage.testimoniesHeading}
              onChange={(e) => setHomepage({ ...homepage, testimoniesHeading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Blog Section Heading</label>
            <input
              type="text"
              value={homepage.blogHeading}
              onChange={(e) => setHomepage({ ...homepage, blogHeading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Prayer Section Heading</label>
            <input
              type="text"
              value={homepage.prayerHeading}
              onChange={(e) => setHomepage({ ...homepage, prayerHeading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Prayer CTA Button Label</label>
            <input
              type="text"
              value={homepage.prayerCtaLabel}
              onChange={(e) => setHomepage({ ...homepage, prayerCtaLabel: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">Prayer Section Description</label>
          <textarea
            rows={2}
            value={homepage.prayerDescription}
            onChange={(e) => setHomepage({ ...homepage, prayerDescription: e.target.value })}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
          />
        </div>
      </div>

      {/* Choose Featured Sermons & Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C]">
          <h3 className="font-serif text-lg font-semibold text-slate-900 dark:text-white">
            Choose Featured Sermons
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Select specific published sermons for the homepage (or leave unchecked to show latest).
          </p>
          {sermons.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No published sermons yet.</p>
          ) : (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {sermons.map((s) => (
                <label key={s._id} className="flex items-center gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homepage.featuredSermonIds.includes(s._id)}
                    onChange={() =>
                      setHomepage({
                        ...homepage,
                        featuredSermonIds: toggleFeaturedId(homepage.featuredSermonIds, s._id),
                      })
                    }
                    className="w-4 h-4 accent-[#0F296B]"
                  />
                  <span className="truncate">{s.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C]">
          <h3 className="font-serif text-lg font-semibold text-slate-900 dark:text-white">
            Choose Featured Events
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Select specific upcoming events for the homepage (or leave unchecked to show upcoming).
          </p>
          {events.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No published upcoming events yet.</p>
          ) : (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {events.map((ev) => (
                <label key={ev._id} className="flex items-center gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homepage.featuredEventIds.includes(ev._id)}
                    onChange={() =>
                      setHomepage({
                        ...homepage,
                        featuredEventIds: toggleFeaturedId(homepage.featuredEventIds, ev._id),
                      })
                    }
                    className="w-4 h-4 accent-[#0F296B]"
                  />
                  <span className="truncate">{ev.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="px-7 py-3 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
        >
          {saving ? 'Saving Homepage...' : 'Save Homepage Configuration'}
        </button>
      </div>
    </form>
  );
}
