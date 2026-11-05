import React, { useEffect, useState } from 'react';
import { Check, Download, Mail, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../lib/api';
import { formatMinistryDate } from '../../lib/media';
import type {
  BlogPostItem,
  CloudImage,
  InquirySubmissionItem,
  NewsletterSubscriberItem,
  PrayerRequestItem,
  ServiceTimeItem,
  TestimonyItem,
  WebsiteSettingsData,
} from '../../types/cms';
import { CloudinaryImageInput } from './CloudinaryImageInput';

const EMPTY_IMG: CloudImage = { url: '', publicId: '', alt: '', width: 0, height: 0 };

// ============================================================================
// 1. TESTIMONIES MANAGER (Add, Edit, Approve, Publish/Unpublish, Delete)
// ============================================================================
export function TestimoniesManager({ onUpdated }: { onUpdated: () => void }) {
  const [items, setItems] = useState<TestimonyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TestimonyItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    personName: '',
    personContext: '',
    title: '',
    content: '',
    image: EMPTY_IMG,
    isApproved: true,
    status: 'published' as 'draft' | 'published',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ testimonies: TestimonyItem[] }>('/api/admin/testimonies');
      setItems(res.testimonies || []);
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
      personName: '',
      personContext: '',
      title: '',
      content: '',
      image: EMPTY_IMG,
      isApproved: true,
      status: 'published',
    });
    setShowModal(true);
  };

  const openEdit = (t: TestimonyItem) => {
    setEditing(t);
    setForm({
      personName: t.personName,
      personContext: t.personContext || '',
      title: t.title || '',
      content: t.content,
      image: t.image || EMPTY_IMG,
      isApproved: t.isApproved,
      status: t.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editing) {
        await apiFetch(`/api/admin/testimonies/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/admin/testimonies', {
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
        text: err instanceof Error ? err.message : 'Unable to save testimony.',
      });
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (
    t: TestimonyItem,
    patch: Partial<Pick<TestimonyItem, 'isApproved' | 'status'>>
  ) => {
    try {
      await apiFetch(`/api/admin/testimonies/${t._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          personName: t.personName,
          personContext: t.personContext,
          title: t.title,
          content: t.content,
          image: t.image || EMPTY_IMG,
          isApproved: patch.isApproved ?? t.isApproved,
          status: patch.status ?? t.status,
        }),
      });
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to update testimony status.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/testimonies/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to delete testimony.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            Testimonies Management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Add, edit, approve, and publish testimonies. Only approved & published testimonies
            appear publicly.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimony</span>
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
          <h3 className="font-serif text-xl font-semibold">No Testimonies Recorded Yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Click “Add Testimony” to record and approve testimonies.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div
              key={t._id}
              className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.personName} {t.personContext ? `· ${t.personContext}` : ''}
                </p>
                {t.title && (
                  <p className="text-xs font-medium text-[#0F296B] dark:text-[#DDB04F] mt-0.5">
                    {t.title}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-2xl">
                  “{t.content}”
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>
                    Approval:{' '}
                    <strong
                      className={
                        t.isApproved
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                      {t.isApproved ? 'Approved' : 'Pending Approval'}
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Status:{' '}
                    <strong>{t.status === 'published' ? 'Published' : 'Draft'}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void quickToggle(t, { isApproved: !t.isApproved })}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium cursor-pointer"
                >
                  {t.isApproved ? 'Revoke Approval' : 'Approve'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void quickToggle(t, {
                      status: t.status === 'published' ? 'draft' : 'published',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium cursor-pointer"
                >
                  {t.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>

                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                {deleteId === t._id ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleDelete(t._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg border text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteId(t._id)}
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 cursor-pointer"
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
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0A193C] border border-slate-200 dark:border-white/15 p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-serif text-2xl font-semibold">
                {editing ? 'Edit Testimony' : 'Add Testimony'}
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
                  <label className="block text-xs font-semibold mb-1.5">Person’s Name *</label>
                  <input
                    type="text"
                    required
                    value={form.personName}
                    onChange={(e) => setForm({ ...form, personName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Location / Context (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.personContext}
                    onChange={(e) => setForm({ ...form, personContext: e.target.value })}
                    placeholder="e.g. Congregation Member"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Headline (Optional)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Testimony Content *</label>
                <textarea
                  rows={5}
                  required
                  minLength={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <CloudinaryImageInput
                label="Optional Photograph"
                folder="gsc/testimonies"
                aspectClass="aspect-square"
                value={form.image}
                onChange={(img) => setForm({ ...form, image: img })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isApproved}
                      onChange={(e) => setForm({ ...form, isApproved: e.target.checked })}
                      className="w-4 h-4 accent-[#0F296B]"
                    />
                    <span>Approved for Public Display</span>
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
                  {saving ? 'Saving...' : 'Save Testimony'}
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
// 2. BLOG & DEVOTIONALS MANAGER
// ============================================================================
export function BlogManager({ onUpdated }: { onUpdated: () => void }) {
  const [items, setItems] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BlogPostItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Devotional',
    author: 'Prophet Victor A.Y.',
    scriptureReference: '',
    featuredImage: EMPTY_IMG,
    status: 'published' as 'draft' | 'published',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ posts: BlogPostItem[] }>('/api/admin/blog');
      setItems(res.posts || []);
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
      excerpt: '',
      content: '',
      category: 'Devotional',
      author: 'Prophet Victor A.Y.',
      scriptureReference: '',
      featuredImage: EMPTY_IMG,
      status: 'published',
    });
    setShowModal(true);
  };

  const openEdit = (p: BlogPostItem) => {
    setEditing(p);
    setForm({
      title: p.title,
      excerpt: p.excerpt || '',
      content: p.content,
      category: p.category || 'Devotional',
      author: p.author || 'Prophet Victor A.Y.',
      scriptureReference: p.scriptureReference || '',
      featuredImage: p.featuredImage || EMPTY_IMG,
      status: p.status,
    });
    setShowModal(true);
  };

  const appendTemplate = (snippet: string) => {
    setForm((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${snippet}` : snippet,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editing) {
        await apiFetch(`/api/admin/blog/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/admin/blog', {
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
        text: err instanceof Error ? err.message : 'Unable to save article.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      await load();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to delete article.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            Blog & Devotionals
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Write devotionals, pastoral articles, and save drafts or publish immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Write Article</span>
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
          <h3 className="font-serif text-xl font-semibold">No Articles Written Yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Click “Write Article” to compose your first devotional or pastoral reflection.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div
              key={p._id}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {p.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{p.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatMinistryDate(p.publishedAt || p.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      p.status === 'published'
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-amber-600 dark:text-amber-400 font-semibold'
                    }
                  >
                    {p.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {deleteId === p._id ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleDelete(p._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg border text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteId(p._id)}
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 cursor-pointer"
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
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0A193C] border border-slate-200 dark:border-white/15 p-6 sm:p-8 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-serif text-2xl font-semibold">
                {editing ? 'Edit Article' : 'Compose Article'}
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
                <label className="block text-xs font-semibold mb-1.5">Article Title *</label>
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
                  <label className="block text-xs font-semibold mb-1.5">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Author</label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
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

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Short Summary / Excerpt (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={450}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-semibold">Article Content *</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => appendTemplate('Key Prayer Reflection:\n')}
                      className="px-2.5 py-1 rounded border border-slate-300 dark:border-white/15 text-[11px] font-medium cursor-pointer"
                    >
                      + Prayer Reflection
                    </button>
                    <button
                      type="button"
                      onClick={() => appendTemplate('• Point 1\n• Point 2')}
                      className="px-2.5 py-1 rounded border border-slate-300 dark:border-white/15 text-[11px] font-medium cursor-pointer"
                    >
                      + Bullet Points
                    </button>
                  </div>
                </div>
                <textarea
                  rows={10}
                  required
                  minLength={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Separate paragraphs with a blank line for clean editorial typography..."
                  className="w-full px-3.5 py-3 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm leading-relaxed"
                />
              </div>

              <CloudinaryImageInput
                label="Featured Article Image"
                folder="gsc/blog"
                value={form.featuredImage}
                onChange={(img) => setForm({ ...form, featuredImage: img })}
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
                  <option value="published">Publish Immediately</option>
                  <option value="draft">Save as Draft</option>
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
                  {saving ? 'Saving...' : 'Save Article'}
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
// 3. PRIVATE PRAYER REQUESTS MANAGER
// ============================================================================
export function PrayerRequestsManager({ onUpdated }: { onUpdated: () => void }) {
  const [requests, setRequests] = useState<PrayerRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ requests: PrayerRequestItem[] }>('/api/admin/prayer-requests');
      setRequests(res.requests || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleStatus = async (reqItem: PrayerRequestItem) => {
    const next = reqItem.status === 'pending' ? 'reviewed' : 'pending';
    await apiFetch(`/api/admin/prayer-requests/${reqItem._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    await load();
    onUpdated();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/admin/prayer-requests/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    await load();
    onUpdated();
  };

  const filtered = requests.filter((r) => (filter === 'all' ? true : r.status === filter));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            Private Prayer Requests
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Confidential intercession inbox. These records are strictly restricted to authorised
            administrators.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-[#0A193C]">
          {(['all', 'pending', 'reviewed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                filter === tab
                  ? 'bg-white dark:bg-[#0F296B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-48 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] text-center">
          <h3 className="font-serif text-xl font-semibold">No Prayer Requests in This View</h3>
          <p className="mt-2 text-sm text-slate-500">
            Submitted visitor prayer requests will appear privately here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {item.requesterName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatMinistryDate(item.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        item.status === 'pending'
                          ? 'text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      }
                    >
                      {item.status === 'pending' ? 'Pending Prayer Review' : 'Reviewed'}
                    </span>
                  </div>
                  {(item.email || item.phone) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {item.email} {item.email && item.phone ? '·' : ''} {item.phone}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleStatus(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{item.status === 'pending' ? 'Mark Reviewed' : 'Mark Pending'}</span>
                  </button>

                  {deleteId === item._id ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleDelete(item._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(null)}
                        className="px-2 py-1.5 rounded-lg border text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteId(item._id)}
                      className="p-2 rounded-lg text-red-600 dark:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {item.subject && (
                <p className="text-xs font-semibold text-[#0F296B] dark:text-[#DDB04F]">
                  Subject: {item.subject}
                </p>
              )}

              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-[#060E24] p-4 rounded-lg border border-slate-200/70 dark:border-white/8">
                {item.requestText}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. CONTACT INFO, SOCIAL MEDIA, WEBSITE SETTINGS & ACCOUNT SETTINGS MANAGERS
// ============================================================================
export function SettingsSectionManager({
  section,
  onUpdated,
}: {
  section: 'contact' | 'social' | 'website';
  onUpdated: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<WebsiteSettingsData | null>(null);
  const [inquiries, setInquiries] = useState<InquirySubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const sRes = await apiFetch<{ settings: WebsiteSettingsData }>('/api/admin/settings');
      setSettings(sRes.settings);
      if (section === 'contact') {
        const inqRes = await apiFetch<{ inquiries: InquirySubmissionItem[] }>(
          '/api/admin/inquiries'
        );
        setInquiries(inqRes.inquiries || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFeedback(null);
    void load();
  }, [section]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await apiFetch<{ settings: WebsiteSettingsData; message: string }>(
        '/api/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify(settings),
        }
      );
      setSettings(res.settings);
      setFeedback({ type: 'ok', text: res.message || 'Settings saved.' });
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const addServiceTime = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      serviceTimes: [
        ...(settings.serviceTimes || []),
        { label: 'Sunday Worship Service', day: 'Sundays', time: '9:00 AM' },
      ],
    });
  };

  const updateServiceTime = (idx: number, patch: Partial<ServiceTimeItem>) => {
    if (!settings) return;
    const next = [...settings.serviceTimes];
    next[idx] = { ...next[idx], ...patch };
    setSettings({ ...settings, serviceTimes: next });
  };

  const removeServiceTime = (idx: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      serviceTimes: settings.serviceTimes.filter((_, i) => i !== idx),
    });
  };

  const toggleInquiryStatus = async (item: InquirySubmissionItem) => {
    const next = item.status === 'pending' ? 'reviewed' : 'pending';
    await apiFetch(`/api/admin/inquiries/${item._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    await load();
    onUpdated();
  };

  const deleteInquiry = async (id: string) => {
    await apiFetch(`/api/admin/inquiries/${id}`, { method: 'DELETE' });
    await load();
    onUpdated();
  };

  if (loading || !settings) {
    return <div className="h-64 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse" />;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            {section === 'contact'
              ? 'Contact Information & Ministry Enquiries'
              : section === 'social'
                ? 'Social Media Links'
                : 'Website & SEO Settings'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {section === 'contact'
              ? 'Publish official contact details, service schedules, and review incoming invitations.'
              : section === 'social'
                ? 'Configure official ministry social media channels.'
                : 'Manage SEO metadata, social share previews, and interface theme.'}
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

        {section === 'contact' && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Official Email Address</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Primary Telephone</label>
                <input
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Secondary Telephone</label>
                <input
                  type="tel"
                  value={settings.secondaryPhone}
                  onChange={(e) => setSettings({ ...settings, secondaryPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Office Hours</label>
                <input
                  type="text"
                  value={settings.officeHours}
                  onChange={(e) => setSettings({ ...settings, officeHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Street / Venue Address</label>
                <input
                  type="text"
                  value={settings.physicalAddress}
                  onChange={(e) => setSettings({ ...settings, physicalAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">City & Country</label>
                <input
                  type="text"
                  value={settings.cityCountry}
                  onChange={(e) => setSettings({ ...settings, cityCountry: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Service & Fellowship Times</label>
                <button
                  type="button"
                  onClick={addServiceTime}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F296B] dark:text-[#DDB04F] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Schedule Row</span>
                </button>
              </div>
              {settings.serviceTimes.map((st, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Service Name"
                    value={st.label}
                    onChange={(e) => updateServiceTime(idx, { label: e.target.value })}
                    className="sm:col-span-5 px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Day"
                    value={st.day}
                    onChange={(e) => updateServiceTime(idx, { day: e.target.value })}
                    className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Time"
                    value={st.time}
                    onChange={(e) => updateServiceTime(idx, { time: e.target.value })}
                    className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeServiceTime(idx)}
                    className="sm:col-span-1 p-2 text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'social' && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                ['facebook', 'Facebook Page URL'],
                ['youtube', 'YouTube Channel URL'],
                ['instagram', 'Instagram URL'],
                ['tiktok', 'TikTok URL'],
                ['twitterX', 'X (Twitter) URL'],
                ['whatsapp', 'WhatsApp Channel / Contact Link'],
                ['telegram', 'Telegram Channel URL'],
                ['podcast', 'Podcast / Audio Channel URL'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1.5">{label}</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={settings.socialLinks[key] || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      socialLinks: { ...settings.socialLinks, [key]: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {section === 'website' && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Ministry Site Name *</label>
                <input
                  type="text"
                  required
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Pastor Name *</label>
                <input
                  type="text"
                  required
                  value={settings.pastorName}
                  onChange={(e) => setSettings({ ...settings, pastorName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Slogan *</label>
                <input
                  type="text"
                  required
                  value={settings.slogan}
                  onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">Default SEO Page Title *</label>
              <input
                type="text"
                required
                value={settings.seoTitle}
                onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Default SEO Meta Description *
              </label>
              <textarea
                rows={3}
                required
                value={settings.seoDescription}
                onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
              />
            </div>

            <CloudinaryImageInput
              label="Social Share Card Image (OpenGraph)"
              folder="gsc/settings"
              value={settings.ogImage}
              onChange={(img) => setSettings({ ...settings, ogImage: img })}
            />

            <div>
              <label className="block text-xs font-semibold mb-1.5">Footer Copyright Text</label>
              <input
                type="text"
                value={settings.footerCopyrightText}
                onChange={(e) => setSettings({ ...settings, footerCopyrightText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
              <p className="text-xs font-semibold mb-2">Interface Theme Preference</p>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                    theme === 'light'
                      ? 'bg-[#0F296B] text-white border-[#0F296B]'
                      : 'border-slate-300 dark:border-white/20'
                  }`}
                >
                  Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#C6922C] text-white border-[#C6922C]'
                      : 'border-slate-300 dark:border-white/20'
                  }`}
                >
                  Dark Mode
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-7 py-3 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Incoming Enquiries, Preaching Invitations & Event Registrations */}
      {section === 'contact' && (
        <div className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-4">
          <h3 className="font-serif text-xl font-semibold text-slate-900 dark:text-white">
            Submitted Enquiries, Preaching Invitations & Registrations ({inquiries.length})
          </h3>
          {inquiries.length === 0 ? (
            <p className="text-sm text-slate-500">
              No contact messages, preaching invitations, or event registrations received yet.
            </p>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq._id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-500">
                      <strong className="text-slate-900 dark:text-white text-sm">
                        {inq.fullName}
                      </strong>{' '}
                      · <span className="capitalize">{inq.type.replace('_', ' ')}</span> ·{' '}
                      {formatMinistryDate(inq.createdAt)} ·{' '}
                      <strong
                        className={
                          inq.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'
                        }
                      >
                        {inq.status}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleInquiryStatus(inq)}
                        className="px-3 py-1 rounded border border-slate-300 dark:border-white/20 text-xs font-medium cursor-pointer"
                      >
                        {inq.status === 'pending' ? 'Mark Reviewed' : 'Mark Pending'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteInquiry(inq._id)}
                        className="p-1.5 text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {inq.email} {inq.phone ? `· ${inq.phone}` : ''}{' '}
                    {inq.ministryOrOrganization ? `· ${inq.ministryOrOrganization}` : ''}{' '}
                    {inq.proposedDate ? `· Proposed: ${inq.proposedDate}` : ''}{' '}
                    {inq.eventLocation ? `· Venue: ${inq.eventLocation}` : ''}
                  </p>
                  {inq.subject && <p className="text-xs font-semibold">{inq.subject}</p>}
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">
                    {inq.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountSettingsManager() {
  const { admin, updateAdminLocal } = useAuth();
  const [form, setForm] = useState({
    email: admin?.email || '',
    displayName: admin?.displayName || 'Prophet Victor A.Y.',
    currentPassword: '',
    newPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await apiFetch<{
        admin: { id: string; email: string; displayName: string; role: 'super_admin' | 'admin' };
        message: string;
      }>('/api/auth/account', {
        method: 'PUT',
        body: JSON.stringify({
          email: form.email,
          displayName: form.displayName,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword || undefined,
        }),
      });
      updateAdminLocal(res.admin);
      setForm((p) => ({ ...p, currentPassword: '', newPassword: '' }));
      setFeedback({ type: 'ok', text: res.message });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to update account settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
          Administrator Account Security
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Update your sign-in email, display name, or rotate your administrator password.
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

      <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5">Display Name *</label>
          <input
            type="text"
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">Administrator Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">
            Current Password * (Required to authorise changes)
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">
            New Password (Optional · Minimum 10 characters)
          </label>
          <input
            type="password"
            minLength={10}
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="Leave blank to keep current password"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
        >
          {saving ? 'Updating Account...' : 'Update Account Credentials'}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 7. NEWSLETTER SUBSCRIBERS MANAGER
// ============================================================================
export function NewsletterSubscribersManager({ onUpdated }: { onUpdated?: () => void }) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ subscribers: NewsletterSubscriberItem[] }>(
        '/api/admin/newsletter-subscribers'
      );
      setSubscribers(res.subscribers || []);
    } catch {
      // transient fetch error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscribers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/newsletter-subscribers/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      await loadSubscribers();
      onUpdated?.();
    } catch {
      // error handled
    }
  };

  const handleExportCsv = () => {
    if (subscribers.length === 0) return;
    const headers = ['Email', 'Full Name', 'Status', 'Source', 'Date Subscribed'];
    const rows = subscribers.map((s) => [
      `"${s.email.replace(/"/g, '""')}"`,
      `"${(s.fullName || '').replace(/"/g, '""')}"`,
      s.status,
      s.source || 'footer',
      new Date(s.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gsc_newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.fullName && s.fullName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            Newsletter Subscribers
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Ministry partners and believers registered to receive updates, prophetic declarations, and sermon alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={subscribers.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscribers by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-xs sm:text-sm outline-none"
          />
        </div>
        <p className="text-xs text-slate-500 whitespace-nowrap">
          Total: <strong className="text-slate-900 dark:text-white">{subscribers.length}</strong> active subscribers
        </p>
      </div>

      {loading ? (
        <div className="h-48 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] text-center">
          <Mail className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-semibold">No Subscribers Found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            {search
              ? 'No subscribers match your search term.'
              : 'Visitors who subscribe using the website footer form will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date Subscribed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {item.email}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {item.fullName || <span className="text-slate-400 italic">Not provided</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {formatMinistryDate(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {deleteId === item._id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleDelete(item._id)}
                            className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(null)}
                            className="px-2 py-1 rounded-md border text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteId(item._id)}
                          aria-label="Delete subscriber"
                          className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
