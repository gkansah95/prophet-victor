import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  GripVertical,
  Images,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { apiFetch, uploadSignedCloudinaryImage } from '../../lib/api';
import { getOptimizedImageUrl } from '../../lib/media';
import type { CloudImage, HeroSlideItem, WebsiteSettingsData } from '../../types/cms';
import { HeroSlider } from '../public/HeroSlider';
import { CloudinaryImageInput } from './CloudinaryImageInput';

interface SliderManagerProps {
  onUpdated: () => void;
}

const EMPTY_SLIDE_FORM = {
  heading: '',
  description: '',
  buttonLabel: '',
  buttonLink: '',
  image: { url: '', publicId: '', alt: '', width: 0, height: 0 } as CloudImage,
  isActive: true,
  status: 'published' as 'draft' | 'published',
};

export function SliderManager({ onUpdated }: SliderManagerProps) {
  const [slides, setSlides] = useState<HeroSlideItem[]>([]);
  const [settings, setSettings] = useState<WebsiteSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formState, setFormState] = useState(EMPTY_SLIDE_FORM);
  const [savingSlide, setSavingSlide] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewIncludeDrafts, setPreviewIncludeDrafts] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const multiFileRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slidesRes, settingsRes] = await Promise.all([
        apiFetch<{ slides: HeroSlideItem[] }>('/api/admin/slides'),
        apiFetch<{ settings: WebsiteSettingsData }>('/api/admin/settings'),
      ]);
      setSlides(slidesRes.slides || []);
      setSettings(settingsRes.settings);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to load slider data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openCreateModal = () => {
    setEditingSlide(null);
    setFormState(EMPTY_SLIDE_FORM);
    setShowFormModal(true);
  };

  const openEditModal = (slide: HeroSlideItem) => {
    setEditingSlide(slide);
    setFormState({
      heading: slide.heading || '',
      description: slide.description || '',
      buttonLabel: slide.buttonLabel || '',
      buttonLink: slide.buttonLink || '',
      image: slide.image,
      isActive: slide.isActive,
      status: slide.status,
    });
    setShowFormModal(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.image.url || !formState.image.publicId) {
      setFeedback({ type: 'err', text: 'Please upload a slide photograph first.' });
      return;
    }

    setSavingSlide(true);
    setFeedback(null);
    try {
      if (editingSlide) {
        await apiFetch(`/api/admin/slides/${editingSlide._id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...formState, order: editingSlide.order }),
        });
        setFeedback({ type: 'ok', text: 'Slide updated.' });
      } else {
        await apiFetch('/api/admin/slides', {
          method: 'POST',
          body: JSON.stringify({ ...formState, order: slides.length }),
        });
        setFeedback({ type: 'ok', text: 'New slide created.' });
      }
      setShowFormModal(false);
      await loadData();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save slide.',
      });
    } finally {
      setSavingSlide(false);
    }
  };

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = Array.from(fileList);
    setBatchUploading(true);
    setFeedback(null);

    try {
      let currentOrder = slides.length;
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setBatchStatus(`Uploading slide ${i + 1} of ${files.length}...`);
        const uploaded = await uploadSignedCloudinaryImage(file, 'gsc/slider', '');
        await apiFetch('/api/admin/slides', {
          method: 'POST',
          body: JSON.stringify({
            heading: '',
            description: '',
            buttonLabel: '',
            buttonLink: '',
            image: uploaded,
            order: currentOrder,
            isActive: true,
            status: 'draft',
          }),
        });
        currentOrder += 1;
      }
      setFeedback({
        type: 'ok',
        text: `Uploaded ${files.length} slide image(s) as drafts. Edit each slide to add headings or publish.`,
      });
      await loadData();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Batch upload interrupted.',
      });
    } finally {
      setBatchUploading(false);
      setBatchStatus('');
      if (multiFileRef.current) {
        multiFileRef.current.value = '';
      }
    }
  };

  const persistOrder = async (nextSlides: HeroSlideItem[]) => {
    setSlides(nextSlides);
    try {
      await apiFetch('/api/admin/slides/reorder', {
        method: 'PUT',
        body: JSON.stringify({ slideIds: nextSlides.map((s) => s._id) }),
      });
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save new slide order.',
      });
    }
  };

  const moveSlide = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const copy = [...slides];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    await persistOrder(copy);
  };

  const handleDropOnIndex = async (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      return;
    }
    const copy = [...slides];
    const [moved] = copy.splice(draggedIdx, 1);
    copy.splice(targetIdx, 0, moved);
    setDraggedIdx(null);
    await persistOrder(copy);
  };

  const toggleSlideField = async (
    slide: HeroSlideItem,
    patch: Partial<Pick<HeroSlideItem, 'isActive' | 'status'>>
  ) => {
    try {
      await apiFetch(`/api/admin/slides/${slide._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          heading: slide.heading,
          description: slide.description,
          buttonLabel: slide.buttonLabel,
          buttonLink: slide.buttonLink,
          image: slide.image,
          order: slide.order,
          isActive: patch.isActive ?? slide.isActive,
          status: patch.status ?? slide.status,
        }),
      });
      await loadData();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to update slide state.',
      });
    }
  };

  const handleDeleteSlide = async (id: string) => {
    try {
      await apiFetch(`/api/admin/slides/${id}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      setFeedback({ type: 'ok', text: 'Slide deleted.' });
      await loadData();
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to delete slide.',
      });
    }
  };

  const handleSaveTiming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    setFeedback(null);
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setFeedback({ type: 'ok', text: 'Slideshow playback settings saved.' });
      onUpdated();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save slideshow settings.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const previewSlides = slides.filter((s) =>
    previewIncludeDrafts ? s.isActive : s.isActive && s.status === 'published'
  );

  return (
    <div className="space-y-8">
      {/* Header & Primary Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
            Homepage Image Slider
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Upload 4 or more carousel photographs, drag to reorder, preview transitions, and control
            publication.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={batchUploading}
            onClick={() => multiFileRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            {batchUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Images className="w-4 h-4" />
            )}
            <span>{batchUploading ? batchStatus : 'Upload Multiple Images'}</span>
          </button>
          <input
            ref={multiFileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleMultiUpload}
            className="hidden"
          />

          {slides.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#C6922C]/50 text-[#0F296B] dark:text-[#EDD089] hover:bg-[#C6922C]/10 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Slideshow</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slide</span>
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

      {/* Slideshow Timing & Autoplay Settings */}
      {settings && (
        <form
          onSubmit={handleSaveTiming}
          className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sliderAutoplay}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, sliderAutoplay: e.target.checked } : prev
                  )
                }
                className="w-4 h-4 accent-[#0F296B]"
              />
              <span>Enable Automatic Sliding</span>
            </label>

            <div className="flex items-center gap-2.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Transition Interval (seconds):
              </label>
              <input
                type="number"
                min={2}
                max={30}
                step={1}
                value={Math.round((settings.sliderIntervalMs || 6000) / 1000)}
                onChange={(e) => {
                  const secs = Math.max(2, Math.min(30, Number(e.target.value) || 6));
                  setSettings((prev) =>
                    prev ? { ...prev, sliderIntervalMs: secs * 1000 } : prev
                  );
                }}
                className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/15 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            {savingSettings ? 'Saving...' : 'Save Playback Settings'}
          </button>
        </form>
      )}

      {/* Slides List with Drag-and-Drop Reordering */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse"
            />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] text-center">
          <h3 className="font-serif text-xl font-semibold text-slate-900 dark:text-white">
            No Carousel Slides Uploaded Yet
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Upload four or more high-resolution ministry photographs to activate the homepage
            carousel.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F296B] dark:bg-[#C6922C] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Slide</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag and drop rows (or use the arrow buttons) to change slide sequence. Currently{' '}
            <span className="font-mono tabular-nums font-semibold">{slides.length}</span> slide(s)
            stored.
          </p>

          {slides.map((slide, idx) => (
            <div
              key={slide._id}
              draggable
              onDragStart={() => setDraggedIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => void handleDropOnIndex(idx)}
              className={`p-4 rounded-xl border transition-colors bg-white dark:bg-[#0A193C] flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                draggedIdx === idx
                  ? 'border-[#C6922C] opacity-70'
                  : 'border-slate-200 dark:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="text-slate-400 cursor-grab active:cursor-grabbing shrink-0"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-5 h-5" />
                </div>

                <span className="font-mono tabular-nums text-xs text-slate-400 w-6 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <img
                  src={getOptimizedImageUrl(slide.image.url, { width: 320, crop: 'fill' })}
                  alt={slide.image.alt || slide.heading || `Slide ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-28 h-16 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {slide.heading || 'Untitled Slide (Image Only)'}
                  </p>
                  {slide.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                      {slide.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Status:{' '}
                      <strong
                        className={
                          slide.status === 'published'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {slide.status === 'published' ? 'Published' : 'Draft'}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Visibility:{' '}
                      <strong>{slide.isActive ? 'Active in Carousel' : 'Deactivated'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => void moveSlide(idx, -1)}
                  aria-label="Move slide up"
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === slides.length - 1}
                  onClick={() => void moveSlide(idx, 1)}
                  aria-label="Move slide down"
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => void toggleSlideField(slide, { isActive: !slide.isActive })}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer whitespace-nowrap"
                >
                  {slide.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void toggleSlideField(slide, {
                      status: slide.status === 'published' ? 'draft' : 'published',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer whitespace-nowrap"
                >
                  {slide.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(slide)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-800 dark:text-white cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                {confirmDeleteId === slide._id ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleDeleteSlide(slide._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(slide._id)}
                    aria-label="Delete slide"
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

      {/* Create / Edit Slide Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0A193C] border border-slate-200 dark:border-white/15 p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                {editingSlide ? 'Edit Slide' : 'Add New Carousel Slide'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="mt-6 space-y-5">
              <CloudinaryImageInput
                label="Slide Photograph *"
                folder="gsc/slider"
                value={formState.image}
                onChange={(img) => setFormState((p) => ({ ...p, image: img }))}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Slide Heading (Optional)
                </label>
                <input
                  type="text"
                  maxLength={180}
                  value={formState.heading}
                  onChange={(e) => setFormState((p) => ({ ...p, heading: e.target.value }))}
                  placeholder="e.g. Seeking God in Spirit and Truth"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Short Description (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formState.description}
                  onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Button Label (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={formState.buttonLabel}
                    onChange={(e) => setFormState((p) => ({ ...p, buttonLabel: e.target.value }))}
                    placeholder="e.g. Watch Sermons"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Destination Link (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={300}
                    value={formState.buttonLink}
                    onChange={(e) => setFormState((p) => ({ ...p, buttonLink: e.target.value }))}
                    placeholder="e.g. /sermons or /events"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Publication Status
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        status: e.target.value as 'draft' | 'published',
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#060E24] text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft (Preview Only)</option>
                  </select>
                </div>

                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2.5 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isActive}
                      onChange={(e) => setFormState((p) => ({ ...p, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-[#0F296B]"
                    />
                    <span>Active in Homepage Slideshow</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlide}
                  className="px-6 py-2.5 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {savingSlide ? 'Saving Slide...' : 'Save Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Carousel Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-[#0A193C] border border-slate-200 dark:border-white/15 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                  Slideshow Live Preview
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Test slide transitions, captions, and links before publishing to visitors.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={previewIncludeDrafts}
                    onChange={(e) => setPreviewIncludeDrafts(e.target.checked)}
                    className="w-4 h-4 accent-[#0F296B]"
                  />
                  <span>Include Draft Slides in Preview</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {previewSlides.length === 0 ? (
              <div className="py-20 text-center text-sm text-slate-500">
                No active slides match the selected preview filter.
              </div>
            ) : (
              <HeroSlider
                slides={previewSlides}
                autoplay={settings?.sliderAutoplay ?? true}
                intervalMs={settings?.sliderIntervalMs ?? 6000}
                previewMode
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
