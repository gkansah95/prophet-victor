import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { ManagedImage } from '../../components/common/ManagedImage';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { apiFetch } from '../../lib/api';
import type { BookItem } from '../../types/cms';

export function BooksPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch<{ books: BookItem[] }>('/api/public/books')
      .then((res) => {
        if (active) setBooks(res.books || []);
      })
      .catch(() => {
        if (active) setBooks([]);
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
        title="Books & Publications"
        description="Official books and spiritual publications by Prophet Victor A.Y. and Global Seekers Chapel."
      />

      <section className="bg-gradient-to-b from-[#081538] to-[#0F296B] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-[#EDD089] font-medium">
            Published Works
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
            Books & Publications
          </h1>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-[#060E24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-72 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse"
                />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="py-16 px-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C] text-center max-w-xl mx-auto">
              <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                No Publications Listed Yet
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Books and ministry publications by Prophet Victor A.Y. will appear here as soon as
                they are published.
              </p>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {books.map((book) => (
                <StaggerItem key={book._id}>
                  <article className="h-full flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                    <div className="w-full sm:w-44 shrink-0">
                      <ManagedImage
                        url={book.coverImage?.url}
                        alt={book.coverImage?.alt || book.title}
                        width={540}
                        fallbackTitle={book.title}
                        fallbackSubtitle={book.author}
                        className="aspect-[3/4] w-full rounded-lg border border-slate-200 dark:border-white/10"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span>{book.author}</span>
                        {book.publicationYear && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>{book.publicationYear}</span>
                          </>
                        )}
                      </div>
                      <h2 className="mt-1.5 font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                        {book.title}
                      </h2>
                      {book.subtitle && (
                        <p className="mt-1 text-sm font-medium text-[#A6761B] dark:text-[#DDB04F]">
                          {book.subtitle}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line flex-1">
                        {book.description}
                      </p>

                      {book.purchaseLink && (
                        <div className="mt-5">
                          <a
                            href={book.purchaseLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                          >
                            <span>Order / Obtain Copy</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
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
