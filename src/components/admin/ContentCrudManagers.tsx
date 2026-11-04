import React, { useEffect, useRef, useState } from 'react';
import { Images, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { apiFetch, uploadSignedCloudinaryImage } from '../../lib/api';
import { formatMinistryDate, getOptimizedImageUrl } from '../../lib/media';
import type {
  BookItem,
  CloudImage,
  EventItem,
  GalleryImageItem,
  SermonItem,
} from '../../types/cms';
import { CloudinaryImageInput } from './CloudinaryImageInput';

const EMPTY_IMAGE: CloudImage = { url: '', publicId: '', alt: '', width: 0, height: 0 };

// ============================================================================
// 1. SERMONS MANAGER
// ============================================================================
export function SermonsManager({ onUpdated }: { onUpdated: () => void }) {
  const [items, setItems] = useState<SermonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SermonItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    sermonDate: new Date().toISOString().slice(0, 10),
    preacher: 'Prophet Victor A.Y.',
    seriesName: '',
    scriptureReference: '',
    youtubeUrl: '',
    audioUrl: '',
    thumbnail: EMPTY_IMAGE,
    isFeatured: false,
    status: 'published' as 'draft' | 'published',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ sermons: SermonItem[] }>('/api/admin/sermons');
      setItems(res.sermons || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      sermonDate: new Date().toISOString().slice(0, 10),
      preacher: 'Prophet Victor A.Y.',
      seriesName: '',
      scriptureReference: '',
      youtubeUrl: '',
      audioUrl: '',
      thumbnail: EMPTY_IMAGE,
      isFeatured: false,
      status: 'published',
    });
    setShowModal(true);
  };

  const openEdit = (s: SermonItem) => {
    setEditing(s);
    setForm({
      title: s.title,
      description: s.description || '',
      sermonDate: s.sermonDate ? new Date(s.sermonDate).toISOString().slice(0, 10) : '',
      preacher: s.preacher || 'Prophet Victor A.Y.',
      seriesName: s.seriesName || '',
      scriptureReference: s.scriptureReference || '',
      youtubeUrl: s.youtubeUrl || '',
      audioUrl: s.audioUrl || '',
      thumbnail: s.thumbnail || EMPTY_IMAGE,
      isFeatured: s.isFeatured,
      status: s.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editing) {
        await apiFetch(`/api/admin/sermons/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/admin/sermons', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      setFeedback({ type: 'ok', text: editing ? 'Sermon updated.' : 'Sermon added.' });
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save sermon.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/sermons/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to delete sermon.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            Sermons & Teachings
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Publish video messages, audio teachings, scripture references, and sermon thumbnails.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sermon</span>
        </button>
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

      {loading ? (
        <div className="h-48 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse" />
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] text-center">
          <h3 className="font-serif text-xl font-semibold">No Sermons Added Yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Click “Add Sermon” to publish your first video or audio message.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div
              key={s._id}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {s.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{s.preacher}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatMinistryDate(s.sermonDate)}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      s.status === 'published'
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-amber-600 dark:text-amber-400 font-semibold'
                    }
                  >
                    {s.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {deleteId === s._id ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleDelete(s._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteId(s._id)}
                    aria-label="Delete sermon"
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0A193C] border border-slate-200 dark:border-white/15 p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-serif text-2xl font-semibold">
                {editing ? 'Edit Sermon' : 'Add Sermon'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Sermon Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Sermon Date *</label>
                  <input
                    type="date"
                    required
                    value={form.sermonDate}
                    onChange={(e) => setForm({ ...form, sermonDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Preacher</label>
                  <input
                    type="text"
                    value={form.preacher}
                    onChange={(e) => setForm({ ...form, preacher: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Series (Optional)</label>
                  <input
                    type="text"
                    value={form.seriesName}
                    onChange={(e) => setForm({ ...form, seriesName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Scripture Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.scriptureReference}
                    onChange={(e) => setForm({ ...form, scriptureReference: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    YouTube Video Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={form.youtubeUrl}
                    onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Audio Stream / MP3 URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={form.audioUrl}
                    onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Description / Notes</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <CloudinaryImageInput
                label="Sermon Thumbnail"
                folder="gsc/sermons"
                value={form.thumbnail}
                onChange={(img) => setForm({ ...form, thumbnail: img })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as 'draft' | 'published' })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      className="w-4 h-4 accent-[#0F296B]"
                    />
                    <span>Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Sermon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. EVENTS MANAGER
// ============================================================================
export function EventsManager({ onUpdated }: { onUpdated: () => void }) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    eventDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    eventTime: '',
    location: '',
    registrationLink: '',
    enableInternalRegistration: false,
    image: EMPTY_IMAGE,
    isFeatured: false,
    isArchived: false,
    status: 'published' as 'draft' | 'published',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ events: EventItem[] }>('/api/admin/events');
      setItems(res.events || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      eventDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      eventTime: '',
      location: '',
      registrationLink: '',
      enableInternalRegistration: false,
      image: EMPTY_IMAGE,
      isFeatured: false,
      isArchived: false,
      status: 'published',
    });
    setShowModal(true);
  };

  const openEdit = (ev: EventItem) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      eventDate: ev.eventDate ? new Date(ev.eventDate).toISOString().slice(0, 10) : '',
      endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 10) : '',
      eventTime: ev.eventTime || '',
      location: ev.location || '',
      registrationLink: ev.registrationLink || '',
      enableInternalRegistration: ev.enableInternalRegistration || false,
      image: ev.image || EMPTY_IMAGE,
      isFeatured: ev.isFeatured,
      isArchived: ev.isArchived,
      status: ev.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        ...form,
        endDate: form.endDate || null,
      };
      if (editing) {
        await apiFetch(`/api/admin/events/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/admin/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      setFeedback({ type: 'ok', text: editing ? 'Programme updated.' : 'Programme created.' });
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save event.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to delete event.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            Events & Programmes
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Schedule upcoming services, conferences, registration options, and archive completed
            events.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
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

      {loading ? (
        <div className="h-48 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse" />
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] text-center">
          <h3 className="font-serif text-xl font-semibold">No Events Scheduled Yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Click “Add Event” to publish upcoming services or programmes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((ev) => (
            <div
              key={ev._id}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {ev.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{formatMinistryDate(ev.eventDate)}</span>
                  {ev.location && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{ev.location}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      ev.status === 'published'
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-amber-600 dark:text-amber-400 font-semibold'
                    }
                  >
                    {ev.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  {ev.isArchived && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Archived</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(ev)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {deleteId === ev._id ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleDelete(ev._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteId(ev._id)}
                    aria-label="Delete event"
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0A193C] border border-slate-200 dark:border-white/15 p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-serif text-2xl font-semibold">
                {editing ? 'Edit Event' : 'Create Event'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Programme Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">End Date (Optional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 6:00 PM GMT"
                    value={form.eventTime}
                    onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Location / Venue</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    External Registration Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={form.registrationLink}
                    onChange={(e) => setForm({ ...form, registrationLink: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Description *</label>
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <CloudinaryImageInput
                label="Event Banner / Photograph"
                folder="gsc/events"
                value={form.image}
                onChange={(img) => setForm({ ...form, image: img })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Publication Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as 'draft' | 'published' })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enableInternalRegistration}
                      onChange={(e) =>
                        setForm({ ...form, enableInternalRegistration: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#0F296B]"
                    />
                    <span>Enable Built-In Website Registration Form</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isArchived}
                      onChange={(e) => setForm({ ...form, isArchived: e.target.checked })}
                      className="w-4 h-4 accent-[#0F296B]"
                    />
                    <span>Archive as Completed Event</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. BOOKS & PUBLICATIONS MANAGER
// ============================================================================
export function BooksManager({ onUpdated }: { onUpdated: () => void }) {
  const [items, setItems] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BookItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    author: 'Prophet Victor A.Y.',
    description: '',
    publicationYear: '',
    purchaseLink: '',
    coverImage: EMPTY_IMAGE,
    isFeatured: false,
    order: 0,
    status: 'published' as 'draft' | 'published',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ books: BookItem[] }>('/api/admin/books');
      setItems(res.books || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      subtitle: '',
      author: 'Prophet Victor A.Y.',
      description: '',
      publicationYear: '',
      purchaseLink: '',
      coverImage: EMPTY_IMAGE,
      isFeatured: false,
      order: items.length,
      status: 'published',
    });
    setShowModal(true);
  };

  const openEdit = (b: BookItem) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      author: b.author || 'Prophet Victor A.Y.',
      description: b.description || '',
      publicationYear: b.publicationYear || '',
      purchaseLink: b.purchaseLink || '',
      coverImage: b.coverImage || EMPTY_IMAGE,
      isFeatured: b.isFeatured,
      order: b.order || 0,
      status: b.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editing) {
        await apiFetch(`/api/admin/books/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/admin/books', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      setFeedback({ type: 'ok', text: editing ? 'Publication updated.' : 'Publication added.' });
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save publication.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/books/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to delete publication.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            Books & Publications
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Manage published books, cover art, descriptions, and purchase links.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Publication</span>
        </button>
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

      {loading ? (
        <div className="h-48 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse" />
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] text-center">
          <h3 className="font-serif text-xl font-semibold">No Books Added Yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Click “Add Publication” to showcase books and ministry writings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div
              key={b._id}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {b.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{b.author}</span>
                  {b.publicationYear && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{b.publicationYear}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      b.status === 'published'
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-amber-600 dark:text-amber-400 font-semibold'
                    }
                  >
                    {b.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {deleteId === b._id ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleDelete(b._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteId(b._id)}
                    aria-label="Delete book"
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0A193C] border border-slate-200 dark:border-white/15 p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-serif text-2xl font-semibold">
                {editing ? 'Edit Publication' : 'Add Publication'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Author *</label>
                  <input
                    type="text"
                    required
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Subtitle (Optional)</label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Publication Year (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.publicationYear}
                    onChange={(e) => setForm({ ...form, publicationYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Purchase / Order Link</label>
                <input
                  type="url"
                  value={form.purchaseLink}
                  onChange={(e) => setForm({ ...form, purchaseLink: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Description *</label>
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <CloudinaryImageInput
                label="Book Cover Image"
                folder="gsc/books"
                aspectClass="aspect-[3/4]"
                value={form.coverImage}
                onChange={(img) => setForm({ ...form, coverImage: img })}
              />

              <div>
                <label className="block text-xs font-semibold mb-1.5">Publication Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as 'draft' | 'published' })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. GALLERY MANAGER (Multi-upload, Category, Replace, Featured, Delete)
// ============================================================================
export function GalleryManager({ onUpdated }: { onUpdated: () => void }) {
  const [items, setItems] = useState<GalleryImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [defaultBatchCategory, setDefaultBatchCategory] = useState('Worship & Services');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GalleryImageItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const multiInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Worship & Services',
    image: EMPTY_IMAGE,
    isFeatured: false,
    order: 0,
    status: 'published' as 'draft' | 'published',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ images: GalleryImageItem[] }>('/api/admin/gallery');
      setItems(res.images || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = Array.from(fileList);
    setBatchUploading(true);
    setFeedback(null);

    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setBatchStatus(`Uploading ${i + 1} of ${files.length}...`);
        const cleanTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        const uploaded = await uploadSignedCloudinaryImage(file, 'gsc/gallery', cleanTitle);
        await apiFetch('/api/admin/gallery', {
          method: 'POST',
          body: JSON.stringify({
            title: cleanTitle || 'Ministry Photograph',
            description: '',
            category: defaultBatchCategory || 'Ministry',
            image: uploaded,
            isFeatured: false,
            order: items.length + i,
            status: 'published',
          }),
        });
      }
      setFeedback({ type: 'ok', text: `Uploaded ${files.length} photograph(s) to Gallery.` });
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Batch gallery upload failed.',
      });
    } finally {
      setBatchUploading(false);
      setBatchStatus('');
      if (multiInputRef.current) multiInputRef.current.value = '';
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      category: defaultBatchCategory || 'Worship & Services',
      image: EMPTY_IMAGE,
      isFeatured: false,
      order: items.length,
      status: 'published',
    });
    setShowModal(true);
  };

  const openEdit = (img: GalleryImageItem) => {
    setEditing(img);
    setForm({
      title: img.title,
      description: img.description || '',
      category: img.category || 'Ministry',
      image: img.image,
      isFeatured: img.isFeatured,
      order: img.order || 0,
      status: img.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image.url || !form.image.publicId) {
      setFeedback({ type: 'err', text: 'Please upload a photograph first.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      if (editing) {
        await apiFetch(`/api/admin/gallery/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/admin/gallery', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save gallery image.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to delete photograph.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            Gallery Management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Upload single or multiple photographs, organise categories, and select featured images.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={defaultBatchCategory}
            onChange={(e) => setDefaultBatchCategory(e.target.value)}
            placeholder="Batch category"
            className="w-40 px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-xs"
          />
          <button
            type="button"
            disabled={batchUploading}
            onClick={() => multiInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            {batchUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Images className="w-4 h-4" />
            )}
            <span>{batchUploading ? batchStatus : 'Batch Upload'}</span>
          </button>
          <input
            ref={multiInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleBatchUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photograph</span>
          </button>
        </div>
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

      {loading ? (
        <div className="h-48 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse" />
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] text-center">
          <h3 className="font-serif text-xl font-semibold">No Gallery Photographs Uploaded Yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Upload photographs individually or in batches to populate the Ministry Gallery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((img) => (
            <div
              key={img._id}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] overflow-hidden flex flex-col"
            >
              <img
                src={getOptimizedImageUrl(img.image.url, { width: 540, crop: 'fill' })}
                alt={img.image.alt || img.title}
                referrerPolicy="no-referrer"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-[#A6761B] dark:text-[#DDB04F] font-medium">
                    {img.category} {img.isFeatured ? '· Featured' : ''} ·{' '}
                    {img.status === 'published' ? 'Published' : 'Draft'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {img.title}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openEdit(img)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F296B] dark:text-[#DDB04F] cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit / Replace</span>
                  </button>

                  {deleteId === img._id ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleDelete(img._id)}
                        className="px-2 py-1 rounded bg-red-600 text-white text-xs cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(null)}
                        className="px-2 py-1 rounded border text-xs cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteId(img._id)}
                      className="text-xs text-red-600 dark:text-red-400 cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0A193C] border border-slate-200 dark:border-white/15 p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-serif text-2xl font-semibold">
                {editing ? 'Edit / Replace Photograph' : 'Add Gallery Photograph'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <CloudinaryImageInput
                label="Gallery Photograph *"
                folder="gsc/gallery"
                value={form.image}
                onChange={(img) => setForm({ ...form, image: img })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Category *</label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as 'draft' | 'published' })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      className="w-4 h-4 accent-[#0F296B]"
                    />
                    <span>Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Photograph'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
