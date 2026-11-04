import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Calendar, ExternalLink, Play } from 'lucide-react';
import { ManagedImage } from '../../components/common/ManagedImage';
import {
  PageTransition,
  RevealBlock,
  StaggerContainer,
  StaggerItem,
} from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { HeroSlider } from '../../components/public/HeroSlider';
import { useSiteData } from '../../context/SiteDataContext';
import { estimateReadingTime, formatMinistryDate } from '../../lib/media';

export function HomePage() {
  const { siteData } = useSiteData();
  const prefersReduced = useReducedMotion();

  const {
    profile,
    settings,
    homepage,
    slides,
    featuredSermons,
    upcomingEvents,
    books,
    gallery,
    testimonies,
    latestPosts,
  } = siteData;

  const vis = homepage.visibility;
  const pastorName = profile.fullName || 'Prophet Victor A.Y.';
  const ministryName = profile.ministryName || 'Global Seekers Chapel';
  const slogan = profile.slogan || 'Seeking God';

  const hasContactInfo = Boolean(
    settings.contactEmail ||
      settings.contactPhone ||
      settings.secondaryPhone ||
      settings.physicalAddress ||
      settings.cityCountry ||
      (settings.serviceTimes && settings.serviceTimes.length > 0)
  );

  return (
    <PageTransition>
      <SeoHead
        title={settings.seoTitle ? undefined : `${pastorName} – ${ministryName}`}
        description={settings.seoDescription}
      />

      {/* A. PREMIUM ROYAL BLUE & GOLD HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#060E24] via-[#0B1E4B] to-[#0F296B] text-white">
        {homepage.heroBackgroundImage?.url && (
          <div className="absolute inset-0 opacity-20">
            <ManagedImage
              url={homepage.heroBackgroundImage.url}
              alt={homepage.heroBackgroundImage.alt || ministryName}
              className="w-full h-full"
              width={1920}
              priority
            />
          </div>
        )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 25%, rgba(198, 146, 44, 0.22), transparent 55%), radial-gradient(circle at 15% 80%, rgba(30, 75, 184, 0.3), transparent 50%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Editorial Brand & Welcome Copy */}
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <div className="flex items-center gap-3 text-xs sm:text-sm uppercase tracking-widest text-[#EDD089] font-medium">
                <span>{ministryName}</span>
                <span aria-hidden="true" className="text-white/35">·</span>
                <span>{slogan}</span>
              </div>

              <h1
                className="mt-4 font-serif font-semibold text-white tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2.5rem, 4.6vw, 4.25rem)' }}
              >
                {pastorName}
              </h1>

              {profile.ministerialTitle && (
                <p className="mt-2 text-base sm:text-lg text-[#DDB04F] font-medium">
                  {profile.ministerialTitle}
                </p>
              )}

              {homepage.heroWelcomeMessage ? (
                <p className="mt-6 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
                  {homepage.heroWelcomeMessage}
                </p>
              ) : (
                <p className="mt-6 text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
                  Welcome to the official personal ministry platform of {pastorName} and{' '}
                  {ministryName} — {slogan}.
                </p>
              )}

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  to={homepage.heroPrimaryCtaLink || '/prayer-requests'}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#C6922C] hover:bg-[#B38222] text-white font-semibold text-sm transition-colors shadow-sm whitespace-nowrap shrink-0"
                >
                  <span>{homepage.heroPrimaryCtaLabel || 'Submit a Prayer Request'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {homepage.heroSecondaryCtaLabel && (
                  <Link
                    to={homepage.heroSecondaryCtaLink || '/sermons'}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-white/25 hover:border-[#DDB04F] hover:bg-white/5 text-white font-medium text-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>{homepage.heroSecondaryCtaLabel}</span>
                  </Link>
                )}
              </div>
            </motion.div>

            {/* Dynamic Portrait Frame of Prophet Victor A.Y. */}
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-md">
                <div className="rounded-2xl p-2 bg-gradient-to-b from-[#DDB04F]/45 via-white/10 to-transparent border border-[#DDB04F]/30 shadow-2xl">
                  <ManagedImage
                    url={profile.profilePhoto?.url}
                    alt={profile.profilePhoto?.alt || pastorName}
                    width={900}
                    priority
                    fallbackTitle={pastorName}
                    fallbackSubtitle={`${ministryName} · ${slogan}`}
                    className="aspect-[4/5] w-full rounded-xl"
                    imgClassName="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* B. HERO IMAGE SLIDER (Dynamically populated from MongoDB & Cloudinary) */}
      {vis.showSlider && slides.length > 0 && (
        <HeroSlider
          slides={slides}
          autoplay={settings.sliderAutoplay}
          intervalMs={settings.sliderIntervalMs}
        />
      )}

      {/* C. ABOUT THE PASTOR SECTION */}
      {vis.showAbout && (
        <section className="py-20 lg:py-24 bg-[#FAFAF8] dark:bg-[#08122E] border-b border-slate-200/70 dark:border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealBlock className="max-w-3xl mx-auto text-center">
              <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                {ministryName} · {slogan}
              </p>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold text-[#0F296B] dark:text-white">
                {homepage.aboutHeading || `About ${pastorName}`}
              </h2>

              {profile.shortIntroduction ? (
                <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {profile.shortIntroduction}
                </p>
              ) : (
                <p className="mt-5 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Learn more about the ministry, vision, and leadership of {pastorName} at{' '}
                  {ministryName}.
                </p>
              )}

              <div className="mt-8">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#0F296B]/25 dark:border-[#DDB04F]/40 text-[#0F296B] dark:text-[#EDD089] hover:bg-[#0F296B] hover:text-white dark:hover:bg-[#C6922C] dark:hover:text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <span>Read Full Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </RevealBlock>
          </div>
        </section>
      )}

      {/* D. FEATURED SERMONS (Hidden cleanly if no published sermons exist) */}
      {vis.showFeaturedSermons && featuredSermons.length > 0 && (
        <section className="py-20 lg:py-24 bg-white dark:bg-[#060E24] border-b border-slate-200/70 dark:border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealBlock className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                  Word & Ministry
                </p>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#0F296B] dark:text-white">
                  {homepage.sermonsHeading || 'Featured Sermons & Teachings'}
                </h2>
                {homepage.sermonsDescription && (
                  <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl text-sm sm:text-base">
                    {homepage.sermonsDescription}
                  </p>
                )}
              </div>
              <Link
                to="/sermons"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F296B] dark:text-[#DDB04F] hover:underline whitespace-nowrap shrink-0"
              >
                <span>View All Sermons</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </RevealBlock>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredSermons.slice(0, 6).map((sermon) => (
                <StaggerItem key={sermon._id}>
                  <Link
                    to={`/sermons/${sermon.slug}`}
                    className="group block h-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] overflow-hidden hover:border-[#C6922C]/60 transition-colors"
                  >
                    <div className="relative aspect-video overflow-hidden">
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
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{sermon.preacher || pastorName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatMinistryDate(sermon.sermonDate)}</span>
                        {sermon.seriesName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{sermon.seriesName}</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-2.5 font-serif text-xl font-semibold text-slate-900 dark:text-white group-hover:text-[#0F296B] dark:group-hover:text-[#DDB04F] transition-colors">
                        {sermon.title}
                      </h3>
                      {sermon.description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {sermon.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* E. UPCOMING EVENTS & PROGRAMMES */}
      {vis.showUpcomingEvents && upcomingEvents.length > 0 && (
        <section className="py-20 lg:py-24 bg-[#FAFAF8] dark:bg-[#08122E] border-b border-slate-200/70 dark:border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealBlock className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                  Fellowship & Gatherings
                </p>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#0F296B] dark:text-white">
                  {homepage.eventsHeading || 'Upcoming Programmes'}
                </h2>
                {homepage.eventsDescription && (
                  <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl text-sm sm:text-base">
                    {homepage.eventsDescription}
                  </p>
                )}
              </div>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F296B] dark:text-[#DDB04F] hover:underline whitespace-nowrap shrink-0"
              >
                <span>All Events & Programmes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </RevealBlock>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.slice(0, 6).map((event) => (
                <StaggerItem key={event._id}>
                  <Link
                    to={`/events/${event.slug}`}
                    className="group flex flex-col h-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C] overflow-hidden hover:border-[#C6922C]/60 transition-colors"
                  >
                    {event.image?.url && (
                      <ManagedImage
                        url={event.image.url}
                        alt={event.image.alt || event.title}
                        width={720}
                        className="aspect-[16/10] w-full"
                        imgClassName="w-full h-full object-cover group-hover:scale-105"
                      />
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#A6761B] dark:text-[#DDB04F] font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatMinistryDate(event.eventDate)}</span>
                        {event.eventTime && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{event.eventTime}</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-2.5 font-serif text-xl font-semibold text-slate-900 dark:text-white group-hover:text-[#0F296B] dark:group-hover:text-[#DDB04F] transition-colors">
                        {event.title}
                      </h3>
                      {event.location && (
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {event.location}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* BOOKS & PUBLICATIONS SPOTLIGHT (If published books exist) */}
      {vis.showBooks && books.length > 0 && (
        <section className="py-20 lg:py-24 bg-white dark:bg-[#060E24] border-b border-slate-200/70 dark:border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealBlock className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                  Written Resources
                </p>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#0F296B] dark:text-white">
                  Books & Publications
                </h2>
              </div>
              <Link
                to="/books"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F296B] dark:text-[#DDB04F] hover:underline whitespace-nowrap shrink-0"
              >
                <span>View All Publications</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </RevealBlock>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {books.slice(0, 4).map((book) => (
                <StaggerItem key={book._id}>
                  <div className="h-full flex flex-col rounded-xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C] overflow-hidden">
                    <ManagedImage
                      url={book.coverImage?.url}
                      alt={book.coverImage?.alt || book.title}
                      width={540}
                      fallbackTitle={book.title}
                      fallbackSubtitle={book.author}
                      className="aspect-[3/4] w-full"
                    />
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span>{book.author}</span>
                        {book.publicationYear && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>{book.publicationYear}</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-1.5 font-serif text-lg font-semibold text-slate-900 dark:text-white">
                        {book.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 flex-1">
                        {book.description}
                      </p>
                      {book.purchaseLink && (
                        <a
                          href={book.purchaseLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F296B] dark:text-[#DDB04F] hover:underline"
                        >
                          <span>Get Copy</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* F. MINISTRY GALLERY */}
      {vis.showGallery && gallery.length > 0 && (
        <section className="py-20 lg:py-24 bg-[#FAFAF8] dark:bg-[#08122E] border-b border-slate-200/70 dark:border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealBlock className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                  Moments in Ministry
                </p>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#0F296B] dark:text-white">
                  {homepage.galleryHeading || 'Ministry Gallery'}
                </h2>
                {homepage.galleryDescription && (
                  <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl text-sm sm:text-base">
                    {homepage.galleryDescription}
                  </p>
                )}
              </div>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F296B] dark:text-[#DDB04F] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Open Full Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </RevealBlock>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {gallery.slice(0, 8).map((item) => (
                <StaggerItem key={item._id}>
                  <Link
                    to="/gallery"
                    className="group block rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A193C]"
                  >
                    <ManagedImage
                      url={item.image.url}
                      alt={item.image.alt || item.title}
                      width={640}
                      className="aspect-[4/3] w-full"
                      imgClassName="w-full h-full object-cover group-hover:scale-105"
                    />
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.category}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* G. TESTIMONIES (Approved & Published Only) */}
      {vis.showTestimonies && testimonies.length > 0 && (
        <section className="py-20 lg:py-24 bg-white dark:bg-[#060E24] border-b border-slate-200/70 dark:border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealBlock className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                  Stories of Grace
                </p>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#0F296B] dark:text-white">
                  {homepage.testimoniesHeading || 'Testimonies'}
                </h2>
              </div>
              <Link
                to="/testimonies"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F296B] dark:text-[#DDB04F] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Read More Testimonies</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </RevealBlock>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonies.slice(0, 3).map((item) => (
                <StaggerItem key={item._id}>
                  <article className="h-full flex flex-col justify-between p-7 rounded-xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                    <div>
                      {item.title && (
                        <h3 className="font-serif text-xl font-semibold text-[#0F296B] dark:text-[#EDD089] mb-3">
                          {item.title}
                        </h3>
                      )}
                      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-5">
                        “{item.content}”
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-3">
                      {item.image?.url && (
                        <ManagedImage
                          url={item.image.url}
                          alt={item.personName}
                          width={120}
                          className="w-10 h-10 rounded-full shrink-0"
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
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* H. BLOG & DEVOTIONALS */}
      {vis.showBlog && latestPosts.length > 0 && (
        <section className="py-20 lg:py-24 bg-[#FAFAF8] dark:bg-[#08122E] border-b border-slate-200/70 dark:border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealBlock className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                  Teaching & Reflection
                </p>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#0F296B] dark:text-white">
                  {homepage.blogHeading || 'Devotionals & Articles'}
                </h2>
              </div>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F296B] dark:text-[#DDB04F] hover:underline whitespace-nowrap shrink-0"
              >
                <span>All Articles & Devotionals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </RevealBlock>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestPosts.map((post) => (
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
                      <h3 className="mt-2.5 font-serif text-xl font-semibold text-slate-900 dark:text-white group-hover:text-[#0F296B] dark:group-hover:text-[#DDB04F] transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {post.excerpt || post.content.slice(0, 160)}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* I. PRAYER REQUEST CALL-TO-ACTION */}
      {vis.showPrayerRequest && (
        <section className="py-20 lg:py-24 bg-gradient-to-r from-[#081538] via-[#0F296B] to-[#0A193C] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <RevealBlock>
              <p className="text-xs uppercase tracking-widest text-[#EDD089] font-semibold">
                Confidential Pastoral Intercession
              </p>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white">
                {homepage.prayerHeading || 'Submit a Prayer Request'}
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto">
                {homepage.prayerDescription ||
                  'Every prayer request submitted is received privately for prayer and spiritual support.'}
              </p>
              <div className="mt-8">
                <Link
                  to="/prayer-requests"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#C6922C] hover:bg-[#B38222] text-white font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <span>{homepage.prayerCtaLabel || 'Send Prayer Request'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </RevealBlock>
          </div>
        </section>
      )}

      {/* J. CONTACT SECTION (Displays ONLY actual administrator-configured contact info) */}
      {vis.showContact && (
        <section className="py-20 bg-white dark:bg-[#060E24]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealBlock className="rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C] p-8 sm:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                    Ministry Office & Invitations
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold text-[#0F296B] dark:text-white">
                    Connect with {ministryName}
                  </h2>

                  {hasContactInfo ? (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-200">
                      {(settings.physicalAddress || settings.cityCountry) && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            Location
                          </p>
                          {settings.physicalAddress && <p className="mt-1">{settings.physicalAddress}</p>}
                          {settings.cityCountry && <p>{settings.cityCountry}</p>}
                        </div>
                      )}

                      {(settings.contactPhone || settings.secondaryPhone || settings.contactEmail) && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            Direct Contact
                          </p>
                          {settings.contactPhone && <p className="mt-1">{settings.contactPhone}</p>}
                          {settings.secondaryPhone && <p>{settings.secondaryPhone}</p>}
                          {settings.contactEmail && <p className="mt-0.5">{settings.contactEmail}</p>}
                        </div>
                      )}

                      {settings.serviceTimes && settings.serviceTimes.length > 0 && (
                        <div className="sm:col-span-2 mt-2">
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            Fellowship Schedule
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                            {settings.serviceTimes.map((st, idx) => (
                              <span key={idx}>
                                <strong className="font-medium">{st.label}:</strong> {st.day} · {st.time}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                      Use our online ministry forms for general enquiries or to extend an official
                      preaching invitation to {pastorName}.
                    </p>
                  )}
                </div>

                <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-3">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <span>Contact & Invitations</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </RevealBlock>
          </div>
        </section>
      )}
    </PageTransition>
  );
}
