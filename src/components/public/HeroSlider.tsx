import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl, getResponsiveSrcSet } from '../../lib/media';
import type { HeroSlideItem } from '../../types/cms';

interface HeroSliderProps {
  slides: HeroSlideItem[];
  autoplay?: boolean;
  intervalMs?: number;
  previewMode?: boolean;
}

export function HeroSlider({
  slides,
  autoplay = true,
  intervalMs = 6000,
  previewMode = false,
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const prefersReduced = useReducedMotion();

  const count = slides.length;

  useEffect(() => {
    if (currentIndex >= count && count > 0) {
      setCurrentIndex(0);
    }
  }, [count, currentIndex]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Automatic sliding with pause-on-hover and focus support
  useEffect(() => {
    if (!autoplay || isPaused || count <= 1) {
      return;
    }
    const safeInterval = Math.max(2000, intervalMs);
    const timer = window.setInterval(goNext, safeInterval);
    return () => window.clearInterval(timer);
  }, [autoplay, isPaused, count, intervalMs, goNext]);

  if (count === 0) {
    return null;
  }

  const activeSlide = slides[currentIndex] || slides[0];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = touchStartX.current - endX;
    if (Math.abs(delta) > 45) {
      if (delta > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartX.current = null;
  };

  const isExternalLink =
    activeSlide.buttonLink.startsWith('http://') || activeSlide.buttonLink.startsWith('https://');

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Ministry Highlights Slideshow"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full overflow-hidden bg-[#060E24] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C6922C] ${
        previewMode ? 'rounded-xl h-[420px] sm:h-[480px]' : 'h-[480px] sm:h-[560px] lg:h-[640px]'
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide._id || currentIndex}
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img
            src={getOptimizedImageUrl(activeSlide.image.url, { width: 1920, crop: 'limit' })}
            srcSet={getResponsiveSrcSet(activeSlide.image.url, [640, 1024, 1440, 1920])}
            sizes="100vw"
            alt={activeSlide.image.alt || activeSlide.heading || 'Global Seekers Chapel'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />

          {/* Measured contrast scrim ensuring WCAG AA readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060E24]/92 via-[#0A193C]/55 to-[#060E24]/30" />

          {(activeSlide.heading || activeSlide.description || activeSlide.buttonLabel) && (
            <div className="absolute inset-0 flex items-end sm:items-center">
              <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 pb-16 sm:pb-0">
                <motion.div
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-2xl"
                >
                  {activeSlide.heading && (
                    <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight">
                      {activeSlide.heading}
                    </h2>
                  )}

                  {activeSlide.description && (
                    <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
                      {activeSlide.description}
                    </p>
                  )}

                  {activeSlide.buttonLabel && activeSlide.buttonLink && (
                    <div className="mt-7">
                      {isExternalLink ? (
                        <a
                          href={activeSlide.buttonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#C6922C] hover:bg-[#B38222] text-white font-medium text-sm transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>{activeSlide.buttonLabel}</span>
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      ) : (
                        <Link
                          to={activeSlide.buttonLink}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#C6922C] hover:bg-[#B38222] text-white font-medium text-sm transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>{activeSlide.buttonLabel}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Previous & Next Controls */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#060E24]/65 hover:bg-[#0F296B] border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#060E24]/65 hover:bg-[#0F296B] border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Navigation Indicators */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5"
            role="tablist"
            aria-label="Slide navigation indicators"
          >
            {slides.map((slide, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={slide._id || idx}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    active ? 'w-8 bg-[#DDB04F]' : 'w-2.5 bg-white/45 hover:bg-white/75'
                  }`}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
