export interface CloudImage {
  url: string;
  publicId: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface PastorProfileData {
  _id?: string;
  fullName: string;
  ministerialTitle: string;
  ministryName: string;
  slogan: string;
  shortIntroduction: string;
  fullBiography: string;
  ministryInformation: string;
  visionStatement: string;
  missionStatement: string;
  profilePhoto: CloudImage;
  secondaryPhoto?: CloudImage;
  isPublished: boolean;
}

export interface ServiceTimeItem {
  label: string;
  day: string;
  time: string;
}

export interface SocialLinksData {
  facebook: string;
  youtube: string;
  instagram: string;
  tiktok: string;
  twitterX: string;
  whatsapp: string;
  telegram: string;
  podcast: string;
}

export interface WebsiteSettingsData {
  _id?: string;
  siteName: string;
  pastorName: string;
  slogan: string;
  seoTitle: string;
  seoDescription: string;
  ogImage?: CloudImage;
  contactEmail: string;
  contactPhone: string;
  secondaryPhone: string;
  physicalAddress: string;
  cityCountry: string;
  officeHours: string;
  serviceTimes: ServiceTimeItem[];
  socialLinks: SocialLinksData;
  sliderAutoplay: boolean;
  sliderIntervalMs: number;
  footerCopyrightText: string;
}

export interface HomepageVisibility {
  showSlider: boolean;
  showAbout: boolean;
  showFeaturedSermons: boolean;
  showUpcomingEvents: boolean;
  showBooks: boolean;
  showGallery: boolean;
  showTestimonies: boolean;
  showBlog: boolean;
  showPrayerRequest: boolean;
  showContact: boolean;
}

export interface HomepageSectionData {
  _id?: string;
  heroWelcomeMessage: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaLink: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaLink: string;
  heroBackgroundImage?: CloudImage;
  aboutHeading: string;
  sermonsHeading: string;
  sermonsDescription: string;
  eventsHeading: string;
  eventsDescription: string;
  galleryHeading: string;
  galleryDescription: string;
  testimoniesHeading: string;
  testimoniesDescription: string;
  blogHeading: string;
  blogDescription: string;
  prayerHeading: string;
  prayerDescription: string;
  prayerCtaLabel: string;
  visibility: HomepageVisibility;
  featuredSermonIds: string[];
  featuredEventIds: string[];
}

export interface HeroSlideItem {
  _id: string;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonLink: string;
  image: CloudImage;
  order: number;
  isActive: boolean;
  status: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
}

export interface SermonItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  sermonDate: string;
  preacher: string;
  seriesName: string;
  scriptureReference: string;
  youtubeUrl: string;
  audioUrl: string;
  thumbnail: CloudImage;
  isFeatured: boolean;
  status: 'draft' | 'published';
  createdAt?: string;
}

export interface EventItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  eventDate: string;
  endDate?: string | null;
  eventTime: string;
  location: string;
  registrationLink: string;
  enableInternalRegistration: boolean;
  image: CloudImage;
  isFeatured: boolean;
  isArchived: boolean;
  status: 'draft' | 'published';
  createdAt?: string;
}

export interface BookItem {
  _id: string;
  title: string;
  slug: string;
  subtitle: string;
  author: string;
  description: string;
  publicationYear: string;
  purchaseLink: string;
  coverImage: CloudImage;
  isFeatured: boolean;
  order: number;
  status: 'draft' | 'published';
}

export interface GalleryImageItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  image: CloudImage;
  isFeatured: boolean;
  order: number;
  status: 'draft' | 'published';
  createdAt?: string;
}

export interface TestimonyItem {
  _id: string;
  personName: string;
  personContext: string;
  title: string;
  content: string;
  image: CloudImage;
  isApproved: boolean;
  status: 'draft' | 'published';
  createdAt?: string;
}

export interface BlogPostItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  scriptureReference: string;
  featuredImage: CloudImage;
  publishedAt?: string | null;
  status: 'draft' | 'published';
  createdAt?: string;
}

export interface PrayerRequestItem {
  _id: string;
  requesterName: string;
  email: string;
  phone: string;
  subject: string;
  requestText: string;
  isConfidential: boolean;
  status: 'pending' | 'reviewed';
  reviewedAt?: string | null;
  createdAt: string;
}

export interface InquirySubmissionItem {
  _id: string;
  type: 'contact' | 'invitation' | 'event_registration';
  fullName: string;
  email: string;
  phone: string;
  ministryOrOrganization: string;
  proposedDate: string;
  eventLocation: string;
  eventTitle: string;
  subject: string;
  message: string;
  status: 'pending' | 'reviewed';
  createdAt: string;
}

export interface BootstrapResponse {
  dbConnected: boolean;
  profile: PastorProfileData;
  settings: WebsiteSettingsData;
  homepage: HomepageSectionData;
  slides: HeroSlideItem[];
  featuredSermons: SermonItem[];
  upcomingEvents: EventItem[];
  books: BookItem[];
  gallery: GalleryImageItem[];
  testimonies: TestimonyItem[];
  latestPosts: BlogPostItem[];
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin';
}

export interface SessionStatusResponse {
  authenticated: boolean;
  authorised: boolean;
  admin: AdminUser | null;
  csrfToken: string | null;
  system: {
    mongoConfigured: boolean;
    dbConnected: boolean;
    cloudinaryConfigured: boolean;
    hasAdminAccount: boolean;
  };
}

export interface AdminOverviewStats {
  totalSlides: number;
  activeSlides: number;
  totalSermons: number;
  publishedSermons: number;
  totalEvents: number;
  upcomingEvents: number;
  totalBooks: number;
  publishedBooks: number;
  totalGallery: number;
  totalTestimonies: number;
  publishedTestimonies: number;
  totalBlogPosts: number;
  publishedBlogPosts: number;
  pendingPrayers: number;
  totalPrayers: number;
  pendingInquiries: number;
  totalMedia: number;
}
