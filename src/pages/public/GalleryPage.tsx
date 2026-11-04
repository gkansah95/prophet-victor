import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ManagedImage } from '../../components/common/ManagedImage';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { apiFetch } from '../../lib/api';
import { getOptimizedImageUrl } from '../../lib/media';
import type { GalleryImageItem } from '../../types/cms';

export function GalleryPage() {
  const [images, setImages] = useState<GalleryImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<{ images: GalleryImageItem[] }>('/api/public/gallery')
      .then((res) => {
        if (active) setImages(res.images || []);
      })
      .catch(() => {
        if (active) setImages([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const img of images) {
      if (img.category && img.category.trim()) {
        set.add(img.category.trim());
      }
    }
    return Array.from(set);
  }, [images]);

  const filteredImages = useMemo(() => {
    if (activeCategory === 'all') return images;
    return images.filter((img) => img.category === activeCategory);
  }, [images, activeCategory]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && filteredImages.length > 1) {
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % filteredImages.length));
      } else if (e.key === 'ArrowLeft' && filteredImages.length > 1) {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + filteredImages.length) % filteredImages.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, filteredImages.length]);

  const activeLightboxItem =
    lightboxIndex !== null ? filteredImages[lightboxIndex] || null : null;

  return (
    <PageTransition>
      <SeoHead
        title="Ministry Gallery"
        description="Photographic gallery from services, fellowships, and ministry gatherings at Global Seekers Chapel."
      />

      <section className="bg-gradient-to-b from-[#081538] to-[#0F296B] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-[#EDD089] font-medium">
            Visual Archive
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
            Ministry Gallery
          </h1>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-[#060E24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.length > 1 && (
            <div className="mb-10 flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-[#0A193C] w-fit">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-white dark:bg-[#0F296B] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                All Photographs
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-white dark:bg-[#0F296B] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="aspect-[4/3] rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse"
                />
              ))}
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="py-16 px-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C] text-center max-w-xl mx-auto">
              <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                No Gallery Photographs Published Yet
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Ministry photographs uploaded by the administrator will appear here dynamically.
              </p>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((item, idx) => (
                <StaggerItem key={item._id}>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="group w-full text-left rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C] hover:border-[#C6922C]/60 transition-colors cursor-pointer"
                  >
                    <ManagedImage
                      url={item.image.url}
                      alt={item.image.alt || item.title}
                      width={800}
                      className="aspect-[4/3] w-full"
                      imgClassName="w-full h-full object-cover group-hover:scale-105"
                    />
                    <div className="p-4">
                      <p className="text-xs text-[#A6761B] dark:text-[#DDB04F] font-medium">
                        {item.category}
                      </p>
                      <h2 className="mt-1 font-serif text-lg font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h2>
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Accessible Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxItem && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={activeLightboxItem.title}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close image viewer"
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {filteredImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(
                      (lightboxIndex - 1 + filteredImages.length) % filteredImages.length
                    );
                  }}
                  aria-label="Previous photograph"
                  className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex + 1) % filteredImages.length);
                  }}
                  aria-label="Next photograph"
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <motion.div
              key={activeLightboxItem._id}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl w-full flex flex-col items-center"
            >
              <img
                src={getOptimizedImageUrl(activeLightboxItem.image.url, {
                  width: 1600,
                  crop: 'limit',
                })}
                alt={activeLightboxItem.image.alt || activeLightboxItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto rounded-lg object-contain"
              />
              <div className="mt-4 text-center max-w-2xl">
                <p className="font-serif text-xl font-semibold text-white">
                  {activeLightboxItem.title}
                </p>
                {activeLightboxItem.description && (
                  <p className="mt-1 text-sm text-slate-300">{activeLightboxItem.description}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
