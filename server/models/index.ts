import mongoose, { Schema, type InferSchemaType } from 'mongoose';

// Reusable embedded schema for Cloudinary-managed images
const CloudImageSchema = new Schema(
  {
    url: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, default: '' },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  { _id: false }
);

// 1. ADMINS COLLECTION (admins)
const AdminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 180,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: 'Prophet Victor A.Y.',
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin'],
      default: 'super_admin',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: 'admins' }
);

// ADMIN SESSIONS COLLECTION (adminSessions) - Server-side HTTP-only session store with TTL
const AdminSessionSchema = new Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    csrfToken: {
      type: String,
      required: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true, collection: 'adminSessions' }
);
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 2. PASTOR PROFILES COLLECTION (pastorProfiles)
const PastorProfileSchema = new Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'primary',
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      default: 'Prophet Victor A.Y.',
    },
    ministerialTitle: {
      type: String,
      trim: true,
      default: '',
    },
    ministryName: {
      type: String,
      required: true,
      trim: true,
      default: 'Global Seekers Chapel',
    },
    slogan: {
      type: String,
      required: true,
      trim: true,
      default: 'Seeking God',
    },
    shortIntroduction: {
      type: String,
      trim: true,
      default: '',
    },
    fullBiography: {
      type: String,
      trim: true,
      default: '',
    },
    ministryInformation: {
      type: String,
      trim: true,
      default: '',
    },
    visionStatement: {
      type: String,
      trim: true,
      default: '',
    },
    missionStatement: {
      type: String,
      trim: true,
      default: '',
    },
    profilePhoto: {
      type: CloudImageSchema,
      default: () => ({ url: '', publicId: '', alt: 'Prophet Victor A.Y.', width: 0, height: 0 }),
    },
    secondaryPhoto: {
      type: CloudImageSchema,
      default: () => ({ url: '', publicId: '', alt: '', width: 0, height: 0 }),
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true, collection: 'pastorProfiles' }
);

// 3. WEBSITE SETTINGS COLLECTION (websiteSettings)
const ServiceTimeSchema = new Schema(
  {
    label: { type: String, trim: true, required: true },
    day: { type: String, trim: true, required: true },
    time: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const WebsiteSettingsSchema = new Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'global',
    },
    siteName: {
      type: String,
      trim: true,
      default: 'Global Seekers Chapel',
    },
    pastorName: {
      type: String,
      trim: true,
      default: 'Prophet Victor A.Y.',
    },
    slogan: {
      type: String,
      trim: true,
      default: 'Seeking God',
    },
    seoTitle: {
      type: String,
      trim: true,
      default: 'Prophet Victor A.Y. – Global Seekers Chapel | Seeking God',
    },
    seoDescription: {
      type: String,
      trim: true,
      default:
        'Official personal ministry website for Prophet Victor A.Y. and Global Seekers Chapel – Seeking God.',
    },
    ogImage: {
      type: CloudImageSchema,
      default: () => ({ url: '', publicId: '', alt: 'Global Seekers Chapel', width: 0, height: 0 }),
    },
    contactEmail: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    secondaryPhone: { type: String, trim: true, default: '' },
    physicalAddress: { type: String, trim: true, default: '' },
    cityCountry: { type: String, trim: true, default: '' },
    officeHours: { type: String, trim: true, default: '' },
    serviceTimes: {
      type: [ServiceTimeSchema],
      default: [],
    },
    socialLinks: {
      facebook: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      tiktok: { type: String, trim: true, default: '' },
      twitterX: { type: String, trim: true, default: '' },
      whatsapp: { type: String, trim: true, default: '' },
      telegram: { type: String, trim: true, default: '' },
      podcast: { type: String, trim: true, default: '' },
    },
    sliderAutoplay: {
      type: Boolean,
      default: true,
    },
    sliderIntervalMs: {
      type: Number,
      default: 6000,
      min: 2000,
      max: 30000,
    },
    footerCopyrightText: {
      type: String,
      trim: true,
      default: 'Prophet Victor A.Y. · Global Seekers Chapel. All rights reserved.',
    },
  },
  { timestamps: true, collection: 'websiteSettings' }
);

// 4. HOMEPAGE SECTIONS COLLECTION (homepageSections)
const HomepageSectionSchema = new Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'home',
    },
    heroWelcomeMessage: {
      type: String,
      trim: true,
      default: '',
    },
    heroPrimaryCtaLabel: {
      type: String,
      trim: true,
      default: 'Submit a Prayer Request',
    },
    heroPrimaryCtaLink: {
      type: String,
      trim: true,
      default: '/prayer-requests',
    },
    heroSecondaryCtaLabel: {
      type: String,
      trim: true,
      default: 'Explore Sermons',
    },
    heroSecondaryCtaLink: {
      type: String,
      trim: true,
      default: '/sermons',
    },
    heroBackgroundImage: {
      type: CloudImageSchema,
      default: () => ({ url: '', publicId: '', alt: '', width: 0, height: 0 }),
    },
    aboutHeading: {
      type: String,
      trim: true,
      default: 'About Prophet Victor A.Y.',
    },
    sermonsHeading: {
      type: String,
      trim: true,
      default: 'Featured Sermons & Teachings',
    },
    sermonsDescription: {
      type: String,
      trim: true,
      default: '',
    },
    eventsHeading: {
      type: String,
      trim: true,
      default: 'Upcoming Programmes & Gatherings',
    },
    eventsDescription: {
      type: String,
      trim: true,
      default: '',
    },
    galleryHeading: {
      type: String,
      trim: true,
      default: 'Ministry Gallery',
    },
    galleryDescription: {
      type: String,
      trim: true,
      default: '',
    },
    testimoniesHeading: {
      type: String,
      trim: true,
      default: 'Testimonies',
    },
    testimoniesDescription: {
      type: String,
      trim: true,
      default: '',
    },
    blogHeading: {
      type: String,
      trim: true,
      default: 'Devotionals & Reflections',
    },
    blogDescription: {
      type: String,
      trim: true,
      default: '',
    },
    prayerHeading: {
      type: String,
      trim: true,
      default: 'Need Prayer Partnership?',
    },
    prayerDescription: {
      type: String,
      trim: true,
      default: 'Share your confidential prayer request directly with the ministry.',
    },
    prayerCtaLabel: {
      type: String,
      trim: true,
      default: 'Send Prayer Request',
    },
    visibility: {
      showSlider: { type: Boolean, default: true },
      showAbout: { type: Boolean, default: true },
      showFeaturedSermons: { type: Boolean, default: true },
      showUpcomingEvents: { type: Boolean, default: true },
      showBooks: { type: Boolean, default: true },
      showGallery: { type: Boolean, default: true },
      showTestimonies: { type: Boolean, default: true },
      showBlog: { type: Boolean, default: true },
      showPrayerRequest: { type: Boolean, default: true },
      showContact: { type: Boolean, default: true },
    },
    featuredSermonIds: [{ type: Schema.Types.ObjectId, ref: 'Sermon' }],
    featuredEventIds: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  },
  { timestamps: true, collection: 'homepageSections' }
);

// 5. HERO SLIDES COLLECTION (heroSlides)
const HeroSlideSchema = new Schema(
  {
    heading: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    buttonLabel: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
    buttonLink: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    image: {
      type: CloudImageSchema,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
  },
  { timestamps: true, collection: 'heroSlides' }
);
HeroSlideSchema.index({ status: 1, isActive: 1, order: 1 });

// 6. SERMONS COLLECTION (sermons)
const SermonSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    sermonDate: {
      type: Date,
      required: true,
      index: true,
    },
    preacher: {
      type: String,
      trim: true,
      default: 'Prophet Victor A.Y.',
    },
    seriesName: {
      type: String,
      trim: true,
      default: '',
    },
    scriptureReference: {
      type: String,
      trim: true,
      default: '',
    },
    youtubeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    audioUrl: {
      type: String,
      trim: true,
      default: '',
    },
    thumbnail: {
      type: CloudImageSchema,
      default: () => ({ url: '', publicId: '', alt: '', width: 0, height: 0 }),
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true, collection: 'sermons' }
);
SermonSchema.index({ status: 1, sermonDate: -1 });

// 7. EVENTS COLLECTION (events)
const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    eventTime: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    registrationLink: {
      type: String,
      trim: true,
      default: '',
    },
    enableInternalRegistration: {
      type: Boolean,
      default: false,
    },
    image: {
      type: CloudImageSchema,
      default: () => ({ url: '', publicId: '', alt: '', width: 0, height: 0 }),
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true, collection: 'events' }
);
EventSchema.index({ status: 1, isArchived: 1, eventDate: 1 });

// 8. BOOKS COLLECTION (books)
const BookSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    author: {
      type: String,
      required: true,
      trim: true,
      default: 'Prophet Victor A.Y.',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    publicationYear: {
      type: String,
      trim: true,
      default: '',
    },
    purchaseLink: {
      type: String,
      trim: true,
      default: '',
    },
    coverImage: {
      type: CloudImageSchema,
      default: () => ({ url: '', publicId: '', alt: '', width: 0, height: 0 }),
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true, collection: 'books' }
);
BookSchema.index({ status: 1, order: 1, createdAt: -1 });

// 9. GALLERY IMAGES COLLECTION (galleryImages)
const GalleryImageSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'Ministry',
      index: true,
    },
    image: {
      type: CloudImageSchema,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
  },
  { timestamps: true, collection: 'galleryImages' }
);
GalleryImageSchema.index({ status: 1, category: 1, createdAt: -1 });

// 10. TESTIMONIES COLLECTION (testimonies)
const TestimonySchema = new Schema(
  {
    personName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    personContext: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    title: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: CloudImageSchema,
      default: () => ({ url: '', publicId: '', alt: '', width: 0, height: 0 }),
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true, collection: 'testimonies' }
);
TestimonySchema.index({ status: 1, isApproved: 1, createdAt: -1 });

// 11. BLOG POSTS COLLECTION (blogPosts)
const BlogPostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 220,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 450,
      default: '',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Devotional',
      index: true,
    },
    author: {
      type: String,
      trim: true,
      default: 'Prophet Victor A.Y.',
    },
    scriptureReference: {
      type: String,
      trim: true,
      default: '',
    },
    featuredImage: {
      type: CloudImageSchema,
      default: () => ({ url: '', publicId: '', alt: '', width: 0, height: 0 }),
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true, collection: 'blogPosts' }
);
BlogPostSchema.index({ status: 1, publishedAt: -1, createdAt: -1 });

// 12. PRAYER REQUESTS COLLECTION (prayerRequests) - Strictly Private
const PrayerRequestSchema = new Schema(
  {
    requesterName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 180,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    requestText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    isConfidential: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed'],
      default: 'pending',
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true, collection: 'prayerRequests' }
);
PrayerRequestSchema.index({ status: 1, createdAt: -1 });

// INQUIRY SUBMISSIONS COLLECTION (inquirySubmissions) - Private Contact, Preaching Invitations & Event Registrations
const InquirySubmissionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['contact', 'invitation', 'event_registration'],
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },
    ministryOrOrganization: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    proposedDate: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    eventLocation: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    eventTitle: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true, collection: 'inquirySubmissions' }
);
InquirySubmissionSchema.index({ type: 1, status: 1, createdAt: -1 });

// 13. MEDIA ASSETS COLLECTION (mediaAssets)
const MediaAssetSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    folder: {
      type: String,
      trim: true,
      default: '',
    },
    format: {
      type: String,
      trim: true,
      default: '',
    },
    bytes: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    alt: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true, collection: 'mediaAssets' }
);

export const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
export const AdminSession =
  mongoose.models.AdminSession || mongoose.model('AdminSession', AdminSessionSchema);
export const PastorProfile =
  mongoose.models.PastorProfile || mongoose.model('PastorProfile', PastorProfileSchema);
export const WebsiteSettings =
  mongoose.models.WebsiteSettings || mongoose.model('WebsiteSettings', WebsiteSettingsSchema);
export const HomepageSection =
  mongoose.models.HomepageSection || mongoose.model('HomepageSection', HomepageSectionSchema);
export const HeroSlide = mongoose.models.HeroSlide || mongoose.model('HeroSlide', HeroSlideSchema);
export const Sermon = mongoose.models.Sermon || mongoose.model('Sermon', SermonSchema);
export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
export const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
export const GalleryImage =
  mongoose.models.GalleryImage || mongoose.model('GalleryImage', GalleryImageSchema);
export const Testimony = mongoose.models.Testimony || mongoose.model('Testimony', TestimonySchema);
export const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);
export const PrayerRequest =
  mongoose.models.PrayerRequest || mongoose.model('PrayerRequest', PrayerRequestSchema);
export const InquirySubmission =
  mongoose.models.InquirySubmission || mongoose.model('InquirySubmission', InquirySubmissionSchema);
export const MediaAsset =
  mongoose.models.MediaAsset || mongoose.model('MediaAsset', MediaAssetSchema);

export type AdminDoc = InferSchemaType<typeof AdminSchema>;
