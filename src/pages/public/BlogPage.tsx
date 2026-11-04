import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ManagedImage } from '../../components/common/ManagedImage';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { apiFetch } from '../../lib/api';
import { estimateReadingTime, formatMinistryDate } from '../../lib/media';
import type { BlogPostItem } from '../../types/cms';

export function BlogPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPostItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (slug) {
      apiFetch<{ post: BlogPostItem }>(`/api/public/blog/${encodeURIComponent(slug)}`)
        .then((res) => {
          if (active) setSelectedPost(res.post);
        })
        .catch(() => {
          if (active) setSelectedPost(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setSelectedPost(null);
      apiFetch<{ posts: BlogPostItem[] }>('/api/public/blog')
        .then((res) => {
          if (active) setPosts(res.posts || []);
        })
        .catch(() => {
          if (active) setPosts([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [slug]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of posts) {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    }
    return Array.from(set);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'all') return posts;
    return posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  // Single Editorial Article Reader
  if (slug) {
    return (
      <PageTransition>
        <SeoHead
          title={selectedPost ? selectedPost.title : 'Blog & Devotionals'}
          description={selectedPost?.excerpt || selectedPost?.content?.slice(0, 155)}
          imageUrl={selectedPost?.featuredImage?.url}
        />

        <section className="py-14 sm:py-20 bg-white dark:bg-[#060E24]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0F296B] dark:text-[#DDB04F] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog & Devotionals</span>
            </Link>

            {loading ? (
              <div className="mt-8 space-y-4 animate-pulse">
                <div className="h-10 w-3/4 bg-slate-200 dark:bg-white/10 rounded" />
                <div className="h-64 w-full bg-slate-200 dark:bg-white/10 rounded-xl" />
              </div>
            ) : !selectedPost ? (
              <div className="mt-10 p-10 rounded-xl border border-slate-200 dark:border-white/10 text-center">
                <h1 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                  Article Not Found
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  This article may be saved as a draft or removed.
                </p>
              </div>
            ) : (
              <article className="mt-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{selectedPost.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedPost.author}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {formatMinistryDate(selectedPost.publishedAt || selectedPost.createdAt)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{estimateReadingTime(selectedPost.content)} min read</span>
                </div>

                <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 dark:text-white leading-tight">
                  {selectedPost.title}
                </h1>

                {selectedPost.scriptureReference && (
                  <p className="mt-3 text-sm font-medium text-[#A6761B] dark:text-[#DDB04F]">
                    Scripture Reference: {selectedPost.scriptureReference}
                  </p>
                )}

                {selectedPost.featuredImage?.url && (
                  <ManagedImage
                    url={selectedPost.featuredImage.url}
                    alt={selectedPost.featuredImage.alt || selectedPost.title}
                    width={1200}
                    className="mt-8 aspect-[16/9] w-full rounded-xl border border-slate-200 dark:border-white/10"
                  />
                )}

                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10 max-w-prose text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed space-y-5">
                  {selectedPost.content
                    .split(/\n{2,}/)
                    .map((para, idx) => (
                      <p key={idx} className="whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                </div>
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
        title="Blog & Devotionals"
        description="Devotionals, reflections, and pastoral articles from Prophet Victor A.Y. and Global Seekers Chapel."
      />

      <section className="bg-gradient-to-b from-[#081538] to-[#0F296B] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-[#EDD089] font-medium">
            Pastoral Writings
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
            Blog & Devotionals
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
                All Articles
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-72 rounded-xl bg-slate-100 dark:bg-[#0A193C] animate-pulse"
                />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-16 px-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C] text-center max-w-xl mx-auto">
              <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                No Published Articles Yet
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Devotionals and pastoral articles will appear here once published.
              </p>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <StaggerItem key={post._id}>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group flex flex-col h-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] overflow-hidden hover:border-[#C6922C]/60 transition-colors"
                  >
                    {post.featuredImage?.url && (
                      <ManagedImage
                        url={post.featuredImage.url}
                        alt={post.featuredImage.alt || post.title}
                        width={720}
                        className="aspect-[16/10] w-full"
                        imgClassName="w-full h-full object-cover group-hover:scale-105"
                      />
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatMinistryDate(post.publishedAt || post.createdAt)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{estimateReadingTime(post.content)} min read</span>
                      </div>
                      <h2 className="mt-2.5 font-serif text-xl font-semibold text-slate-900 dark:text-white group-hover:text-[#0F296B] dark:group-hover:text-[#DDB04F] transition-colors">
                        {post.title}
                      </h2>
                      <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {post.excerpt || post.content.slice(0, 180)}
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
