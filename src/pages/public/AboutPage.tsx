import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ManagedImage } from '../../components/common/ManagedImage';
import { PageTransition, RevealBlock } from '../../components/common/MotionPrimitives';
import { SeoHead } from '../../components/common/SeoHead';
import { useSiteData } from '../../context/SiteDataContext';

export function AboutPage() {
  const { siteData } = useSiteData();
  const { profile } = siteData;

  const pastorName = profile.fullName || 'Prophet Victor A.Y.';
  const ministryName = profile.ministryName || 'Global Seekers Chapel';
  const slogan = profile.slogan || 'Seeking God';

  const hasDetailedContent = Boolean(
    profile.shortIntroduction ||
      profile.fullBiography ||
      profile.ministryInformation ||
      profile.visionStatement ||
      profile.missionStatement
  );

  return (
    <PageTransition>
      <SeoHead
        title={`About ${pastorName}`}
        description={
          profile.shortIntroduction ||
          `Official profile of ${pastorName}, ${ministryName} – ${slogan}.`
        }
        imageUrl={profile.profilePhoto?.url}
      />

      {/* Institutional Header */}
      <section className="bg-gradient-to-b from-[#081538] to-[#0F296B] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 text-xs uppercase tracking-widest text-[#EDD089] font-medium">
            <span>{ministryName}</span>
            <span aria-hidden="true" className="text-white/35">·</span>
            <span>{slogan}</span>
          </div>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
            {pastorName}
          </h1>
          {profile.ministerialTitle && (
            <p className="mt-2 text-lg text-[#DDB04F] font-medium">{profile.ministerialTitle}</p>
          )}
        </div>
      </section>

      {/* Main Editorial Biography & Vision */}
      <section className="py-16 sm:py-24 bg-white dark:bg-[#060E24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Portrait Column */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl p-2 border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
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

              {profile.secondaryPhoto?.url && (
                <div className="mt-6 rounded-2xl p-2 border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                  <ManagedImage
                    url={profile.secondaryPhoto.url}
                    alt={profile.secondaryPhoto.alt || ministryName}
                    width={800}
                    className="aspect-[16/10] w-full rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Editorial Reading Column (Optimal 65-75ch Measure) */}
            <div className="lg:col-span-7 max-w-2xl">
              {hasDetailedContent ? (
                <div className="space-y-10">
                  {profile.shortIntroduction && (
                    <RevealBlock>
                      <p className="font-serif text-2xl sm:text-3xl text-[#0F296B] dark:text-[#EDD089] leading-snug">
                        {profile.shortIntroduction}
                      </p>
                    </RevealBlock>
                  )}

                  {profile.fullBiography && (
                    <RevealBlock>
                      <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-white/10">
                        Biography
                      </h2>
                      <div className="mt-5 space-y-4 text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        {profile.fullBiography}
                      </div>
                    </RevealBlock>
                  )}

                  {profile.ministryInformation && (
                    <RevealBlock>
                      <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-white/10">
                        {ministryName}
                      </h2>
                      <div className="mt-5 space-y-4 text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        {profile.ministryInformation}
                      </div>
                    </RevealBlock>
                  )}

                  {(profile.visionStatement || profile.missionStatement) && (
                    <RevealBlock className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                      {profile.visionStatement && (
                        <div className="p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                          <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                            Vision
                          </p>
                          <p className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                            {profile.visionStatement}
                          </p>
                        </div>
                      )}

                      {profile.missionStatement && (
                        <div className="p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                          <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                            Mission
                          </p>
                          <p className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                            {profile.missionStatement}
                          </p>
                        </div>
                      )}
                    </RevealBlock>
                  )}
                </div>
              ) : (
                <RevealBlock className="p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#0A193C]">
                  <p className="text-xs uppercase tracking-widest text-[#A6761B] dark:text-[#DDB04F] font-semibold">
                    Official Ministry Profile
                  </p>
                  <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                    {pastorName} · {ministryName}
                  </h2>
                  <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {pastorName} serves in ministry with {ministryName} ({slogan}). Extended
                    biographical notes, vision statements, and ministry chronicles will appear here
                    once published.
                  </p>
                </RevealBlock>
              )}

              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-sm font-semibold transition-colors"
                >
                  <span>Ministry Invitations & Contact</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/prayer-requests"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 dark:border-white/20 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors"
                >
                  <span>Submit Prayer Request</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
