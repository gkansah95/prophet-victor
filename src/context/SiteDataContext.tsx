import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { BootstrapResponse } from '../types/cms';

const FALLBACK_BOOTSTRAP: BootstrapResponse = {
  dbConnected: false,
  profile: {
    fullName: 'Prophet Victor A.Y.',
    ministerialTitle: '',
    ministryName: 'Global Seekers Chapel',
    slogan: 'Seeking God',
    shortIntroduction: '',
    fullBiography: '',
    ministryInformation: '',
    visionStatement: '',
    missionStatement: '',
    profilePhoto: { url: '', publicId: '', alt: 'Prophet Victor A.Y.' },
    secondaryPhoto: { url: '', publicId: '', alt: '' },
    isPublished: true,
  },
  settings: {
    siteName: 'Global Seekers Chapel',
    pastorName: 'Prophet Victor A.Y.',
    slogan: 'Seeking God',
    seoTitle: 'Prophet Victor A.Y. – Global Seekers Chapel | Seeking God',
    seoDescription:
      'Official personal ministry website for Prophet Victor A.Y. and Global Seekers Chapel – Seeking God.',
    ogImage: { url: '', publicId: '', alt: 'Global Seekers Chapel' },
    contactEmail: '',
    contactPhone: '',
    secondaryPhone: '',
    physicalAddress: '',
    cityCountry: '',
    officeHours: '',
    serviceTimes: [],
    socialLinks: {
      facebook: '',
      youtube: '',
      instagram: '',
      tiktok: '',
      twitterX: '',
      whatsapp: '',
      telegram: '',
      podcast: '',
    },
    sliderAutoplay: true,
    sliderIntervalMs: 6000,
    footerCopyrightText: 'Prophet Victor A.Y. · Global Seekers Chapel. All rights reserved.',
  },
  homepage: {
    heroWelcomeMessage: '',
    heroPrimaryCtaLabel: 'Submit a Prayer Request',
    heroPrimaryCtaLink: '/prayer-requests',
    heroSecondaryCtaLabel: 'Explore Sermons',
    heroSecondaryCtaLink: '/sermons',
    heroBackgroundImage: { url: '', publicId: '', alt: '' },
    aboutHeading: 'About Prophet Victor A.Y.',
    sermonsHeading: 'Featured Sermons & Teachings',
    sermonsDescription: '',
    eventsHeading: 'Upcoming Programmes & Gatherings',
    eventsDescription: '',
    galleryHeading: 'Ministry Gallery',
    galleryDescription: '',
    testimoniesHeading: 'Testimonies',
    testimoniesDescription: '',
    blogHeading: 'Devotionals & Reflections',
    blogDescription: '',
    prayerHeading: 'Need Prayer Partnership?',
    prayerDescription: 'Share your confidential prayer request directly with the ministry.',
    prayerCtaLabel: 'Send Prayer Request',
    visibility: {
      showSlider: true,
      showAbout: true,
      showFeaturedSermons: true,
      showUpcomingEvents: true,
      showBooks: true,
      showGallery: true,
      showTestimonies: true,
      showBlog: true,
      showPrayerRequest: true,
      showContact: true,
    },
    featuredSermonIds: [],
    featuredEventIds: [],
  },
  slides: [],
  featuredSermons: [],
  upcomingEvents: [],
  books: [],
  gallery: [],
  testimonies: [],
  latestPosts: [],
};

interface SiteDataContextValue {
  siteData: BootstrapResponse;
  loading: boolean;
  refreshSiteData: () => Promise<void>;
}

const SiteDataContext = createContext<SiteDataContextValue>({
  siteData: FALLBACK_BOOTSTRAP,
  loading: true,
  refreshSiteData: async () => {},
});

export function SiteDataProvider({ children }: { children: React.ReactNode }) {
  const [siteData, setSiteData] = useState<BootstrapResponse>(FALLBACK_BOOTSTRAP);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSiteData = useCallback(async () => {
    try {
      const response = await apiFetch<BootstrapResponse>('/api/public/bootstrap');
      setSiteData(response);
    } catch {
      // Preserve verified baseline identity if network fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSiteData();
  }, [refreshSiteData]);

  return (
    <SiteDataContext.Provider value={{ siteData, loading, refreshSiteData }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData(): SiteDataContextValue {
  return useContext(SiteDataContext);
}
