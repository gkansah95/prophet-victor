import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Headphones, Play, Search } from 'lucide-react';
import { ManagedImage } from '../../components/common/ManagedImage';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { apiFetch } from '../../lib/api';
import { formatMinistryDate, getYouTubeEmbedUrl } from '../../lib/media';
import type { SermonItem } from '../../types/cms';

export function SermonsPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [sermons, setSermons] = useState<SermonItem[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<SermonItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('all');

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (slug) {
      apiFetch<{ sermon: SermonItem }>(`/api/public/sermons/${encodeURIComponent(slug)}`)
        .then((res) => {
          if (active) setSelectedSermon(res.sermon);
        })
        .catch(() => {
          if (active) setSelectedSermon(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setSelectedSermon(null);
      apiFetch<{ sermons: SermonItem[] }>('/api/public/sermons')
        .then((res) => {
          if (active) setSermons(res.sermons || []);
        })
        .catch(() => {
          if (active) setSermons([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [slug]);

  const seriesList = useMemo(() => {
    const unique = new Set<string>();
    for (const s of sermons) {
      if (s.seriesName && s.seriesName.trim()) {
        unique.add(s.seriesName.trim());
      }
    }
    return Array.from(unique);
  }, [sermons]);

  const filteredSermons = useMemo(() => {
    return sermons.filter((s) => {
      const matchesSeries = selectedSeries === 'all' || s.seriesName === selectedSeries;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesSeries;
      return (
        matchesSeries &&
        (s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.preacher.toLowerCase().includes(q) ||
          s.scriptureReference.toLowerCase().includes(q))
      );
    });
  }, [sermons, selectedSeries, searchQuery]);

  // Single Sermon Detail View
  if (slug) {
    const embedUrl = getYouTubeEmbedUrl(selectedSermon?.youtubeUrl);

    return (
      <PageTransition>
        <SeoHead
          title={selectedSermon ? selectedSermon.title : 'Sermons & Teachings'}
          description={selectedSermon?.description?.slice(0, 160)}
          imageUrl={selectedSermon?.thumbnail?.url}
        />

        <section className="py-14 sm:py-20 bg-white dark:bg-[#060E24]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/sermons"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0F296B] dark:text-[#DDB04F] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sermons & Teachings</span>
            </Link>

            {loading ? (
              <div className="mt-8 space-y-4 animate-pulse">
                <div className="h-10 w-2/3 bg-slate-200 dark:bg-white/10 rounded" />
                <div className="aspect-video w-full bg-slate-200 dark:bg-white/10 rounded-xl" />
              </div>
            ) : !selectedSermon ? (
              <div className="mt-10 p-10 rounded-xl border border-slate-200 dark:border-white/10 text-center">
                <h1 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                  Sermon Not Found
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  This message may be unpublished or moved.
                </p>
              </div>
            ) : (
              <article className="mt-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{selectedSermon.preacher}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatMinistryDate(selectedSermon.sermonDate)}</span>
                  {selectedSermon.seriesName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{selectedSermon.seriesName}</span>
                    </>
                  )}
                  {selectedSermon.scriptureReference && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{selectedSermon.scriptureReference}</span>
                    </>
                  )}
                </div>

                <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 dark:text-white">
                  {selectedSermon.title}
                </h1>

                {/* YouTube Video Embed or Thumbnail */}
                {embedUrl ? (
                  <div className="mt-8 aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-white/10">
                    <iframe
                      src={embedUrl}
                      title={selectedSermon.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                ) : selectedSermon.thumbnail?.url ? (
                  <ManagedImage
                    url={selectedSermon.thumbnail.url}
                    alt={selectedSermon.thumbnail.alt || selectedSermon.title}
                    width={1200}
                    className="mt-8 aspect-video w-full rounded-xl border border-slate-200 dark:border-white/10"
                  />
                ) : null}

                {selectedSermon.youtubeUrl && !embedUrl && (
                  <div className="mt-6">
                    <a
                      href={selectedSermon.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F296B] text-white text-sm font-semibold"
                    >
                      <span>Watch Video Message</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Audio Player */}
                {selectedSermon.audioUrl && (
                  <div className="mt-6 p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F296B] dark:text-[#DDB04F] mb-3">
                      <Headphones className="w-4 h-4" />
                      <span>Audio Teaching</span>
                    </div>
                    <audio controls preload="metadata" className="w-full">
                      <source src={selectedSermon.audioUrl} />
                      Your browser does not support the audio player.
                    </audio>
                  </div>
                )}

                {selectedSermon.description && (
                  <div className="mt-8 max-w-prose text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {selectedSermon.description}
                  </div>
                )}
              </article>
            )}
          </div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <SeoHead
        title="Sermons & Teachings"
        description="Watch and listen to sermons and teachings by Prophet Victor A.Y. at Global Seekers Chapel."
      />

      <section className="bg-gradient-to-b from-[#081538] to-[#0F296B] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-[#EDD089] font-medium">
            Word & Teaching Archive
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
            Sermons & Teachings
          </h1>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-[#060E24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {sermons.length > 0 && (
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sermons, scriptures, preacher..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0A193C] text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {seriesList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-[#0A193C]">
                  <button
                    type="button"
                    onClick={() => setSelectedSeries('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      selectedSeries === 'all'
                        ? 'bg-white dark:bg-[#0F296B] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Series
                  </button>
                  {seriesList.map((series) => (
                    <button
                      key={series}
                      type="button"
                      onClick={() => setSelectedSeries(series)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        selectedSeries === series
                          ? 'bg-white dark:bg-[#0F296B] text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {series}
                    </button>
                  ))}
                </div>
              )}
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
          ) : filteredSermons.length === 0 ? (
            <div className="py-16 px-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C] text-center max-w-xl mx-auto">
              <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                {sermons.length === 0 ? 'No Published Sermons Yet' : 'No Matching Sermons'}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {sermons.length === 0
                  ? 'Sermons and audio/video teachings will appear here automatically once published.'
                  : 'Try adjusting your search keywords or series filter.'}
              </p>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSermons.map((sermon) => (
                <StaggerItem key={sermon._id}>
                  <Link
                    to={`/sermons/${sermon.slug}`}
                    className="group flex flex-col h-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] overflow-hidden hover:border-[#C6922C]/60 transition-colors"
                  >
                    <div className="relative aspect-video">
                      <ManagedImage
                        url={sermon.thumbnail?.url}
                        alt={sermon.thumbnail?.alt || sermon.title}
                        width={720}
                        fallbackTitle={sermon.title}
                        fallbackSubtitle={sermon.preacher}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover group-hover:scale-105"
                      />
                      <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#060E24]/80 text-[#DDB04F] flex items-center justify-center">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{sermon.preacher}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatMinistryDate(sermon.sermonDate)}</span>
                        {sermon.scriptureReference && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{sermon.scriptureReference}</span>
                          </>
                        )}
                      </div>
                      <h2 className="mt-2.5 font-serif text-xl font-semibold text-slate-900 dark:text-white group-hover:text-[#0F296B] dark:group-hover:text-[#DDB04F] transition-colors">
                        {sermon.title}
                      </h2>
                      {sermon.description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {sermon.description}
                        </p>
                      )}
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
