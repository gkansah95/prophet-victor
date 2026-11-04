import { useEffect, useState } from 'react';
import { ManagedImage } from '../../components/common/ManagedImage';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { apiFetch } from '../../lib/api';
import { formatMinistryDate } from '../../lib/media';
import type { TestimonyItem } from '../../types/cms';

export function TestimoniesPage() {
  const [testimonies, setTestimonies] = useState<TestimonyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch<{ testimonies: TestimonyItem[] }>('/api/public/testimonies')
      .then((res) => {
        if (active) setTestimonies(res.testimonies || []);
      })
      .catch(() => {
        if (active) setTestimonies([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PageTransition>
      <SeoHead
        title="Testimonies"
        description="Read approved testimonies of God's faithfulness from Global Seekers Chapel."
      />

      <section className="bg-gradient-to-b from-[#081538] to-[#0F296B] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-[#EDD089] font-medium">
            Stories of Faithfulness
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
            Testimonies
          </h1>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-[#060E24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-56 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse"
                />
              ))}
            </div>
          ) : testimonies.length === 0 ? (
            <div className="py-16 px-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C] text-center max-w-xl mx-auto">
              <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                No Published Testimonies Yet
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Approved and published testimonies will appear here.
              </p>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonies.map((item) => (
                <StaggerItem key={item._id}>
                  <article className="h-full flex flex-col justify-between p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                    <div>
                      {item.title && (
                        <h2 className="font-serif text-2xl font-semibold text-[#0F296B] dark:text-[#EDD089] mb-3">
                          {item.title}
                        </h2>
                      )}
                      <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        “{item.content}”
                      </p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.image?.url && (
                          <ManagedImage
                            url={item.image.url}
                            alt={item.personName}
                            width={140}
                            className="w-11 h-11 rounded-full shrink-0"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {item.personName}
                          </p>
                          {item.personContext && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.personContext}
                            </p>
                          )}
                        </div>
                      </div>
                      {item.createdAt && (
                        <span className="text-xs text-slate-400">
                          {formatMinistryDate(item.createdAt)}
                        </span>
                      )}
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
