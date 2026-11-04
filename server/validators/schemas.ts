import { z } from 'zod';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join(' ');
}

export const cloudImageSchema = z
  .object({
    url: z.string().max(1500).default(''),
    publicId: z.string().max(400).default(''),
    alt: z.string().max(250).default(''),
    width: z.number().nonnegative().optional().default(0),
    height: z.number().nonnegative().optional().default(0),
  })
  .default({ url: '', publicId: '', alt: '', width: 0, height: 0 });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.').max(180),
  password: z.string().min(1, 'Password is required.').max(256),
});

export const updateAdminAccountSchema = z.object({
  email: z.string().email('Please enter a valid email address.').max(180),
  displayName: z.string().min(2, 'Display name must be at least 2 characters.').max(120),
  currentPassword: z.string().min(1, 'Current password is required to update account settings.').max(256),
  newPassword: z
    .string()
    .max(256)
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: 'New password must be at least 10 characters long.',
    }),
});

export const signUploadSchema = z.object({
  folder: z.string().min(3).max(80),
  mimeType: z.string().min(3).max(80),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
});

export const registerMediaSchema = z.object({
  url: z.string().url().refine((u) => u.includes('cloudinary.com'), {
    message: 'Media URL must originate from Cloudinary.',
  }),
  publicId: z.string().min(3).max(400).refine((id) => id.startsWith('gsc/'), {
    message: 'Invalid media public identifier.',
  }),
  folder: z.string().max(80).default(''),
  format: z.string().max(20).default(''),
  bytes: z.number().nonnegative().default(0),
  width: z.number().nonnegative().default(0),
  height: z.number().nonnegative().default(0),
  alt: z.string().max(250).default(''),
});

export const pastorProfileSchema = z.object({
  fullName: z.string().min(2).max(140),
  ministerialTitle: z.string().max(140).default(''),
  ministryName: z.string().min(2).max(160),
  slogan: z.string().min(2).max(140),
  shortIntroduction: z.string().max(1500).default(''),
  fullBiography: z.string().max(30000).default(''),
  ministryInformation: z.string().max(15000).default(''),
  visionStatement: z.string().max(5000).default(''),
  missionStatement: z.string().max(5000).default(''),
  profilePhoto: cloudImageSchema,
  secondaryPhoto: cloudImageSchema.optional(),
  isPublished: z.boolean().default(true),
});

export const websiteSettingsSchema = z.object({
  siteName: z.string().min(2).max(140),
  pastorName: z.string().min(2).max(140),
  slogan: z.string().min(2).max(140),
  seoTitle: z.string().min(5).max(160),
  seoDescription: z.string().min(10).max(320),
  ogImage: cloudImageSchema.optional(),
  contactEmail: z
    .string()
    .max(180)
    .default('')
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'Contact email must be a valid email address.',
    }),
  contactPhone: z.string().max(60).default(''),
  secondaryPhone: z.string().max(60).default(''),
  physicalAddress: z.string().max(400).default(''),
  cityCountry: z.string().max(180).default(''),
  officeHours: z.string().max(240).default(''),
  serviceTimes: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        day: z.string().min(1).max(80),
        time: z.string().min(1).max(80),
      })
    )
    .max(15)
    .default([]),
  socialLinks: z
    .object({
      facebook: z.string().max(500).default(''),
      youtube: z.string().max(500).default(''),
      instagram: z.string().max(500).default(''),
      tiktok: z.string().max(500).default(''),
      twitterX: z.string().max(500).default(''),
      whatsapp: z.string().max(500).default(''),
      telegram: z.string().max(500).default(''),
      podcast: z.string().max(500).default(''),
    })
    .default({
      facebook: '',
      youtube: '',
      instagram: '',
      tiktok: '',
      twitterX: '',
      whatsapp: '',
      telegram: '',
      podcast: '',
    }),
  sliderAutoplay: z.boolean().default(true),
  sliderIntervalMs: z.number().int().min(2000).max(30000).default(6000),
  footerCopyrightText: z.string().max(240).default(''),
});

export const homepageSectionSchema = z.object({
  heroWelcomeMessage: z.string().max(1000).default(''),
  heroPrimaryCtaLabel: z.string().max(60).default('Submit a Prayer Request'),
  heroPrimaryCtaLink: z.string().max(300).default('/prayer-requests'),
  heroSecondaryCtaLabel: z.string().max(60).default('Explore Sermons'),
  heroSecondaryCtaLink: z.string().max(300).default('/sermons'),
  heroBackgroundImage: cloudImageSchema.optional(),
  aboutHeading: z.string().max(140).default('About Prophet Victor A.Y.'),
  sermonsHeading: z.string().max(140).default('Featured Sermons & Teachings'),
  sermonsDescription: z.string().max(400).default(''),
  eventsHeading: z.string().max(140).default('Upcoming Programmes & Gatherings'),
  eventsDescription: z.string().max(400).default(''),
  galleryHeading: z.string().max(140).default('Ministry Gallery'),
  galleryDescription: z.string().max(400).default(''),
  testimoniesHeading: z.string().max(140).default('Testimonies'),
  testimoniesDescription: z.string().max(400).default(''),
  blogHeading: z.string().max(140).default('Devotionals & Reflections'),
  blogDescription: z.string().max(400).default(''),
  prayerHeading: z.string().max(140).default('Need Prayer Partnership?'),
  prayerDescription: z.string().max(500).default(''),
  prayerCtaLabel: z.string().max(60).default('Send Prayer Request'),
  visibility: z.object({
    showSlider: z.boolean().default(true),
    showAbout: z.boolean().default(true),
    showFeaturedSermons: z.boolean().default(true),
    showUpcomingEvents: z.boolean().default(true),
    showBooks: z.boolean().default(true),
    showGallery: z.boolean().default(true),
    showTestimonies: z.boolean().default(true),
    showBlog: z.boolean().default(true),
    showPrayerRequest: z.boolean().default(true),
    showContact: z.boolean().default(true),
  }),
  featuredSermonIds: z.array(z.string()).max(12).default([]),
  featuredEventIds: z.array(z.string()).max(12).default([]),
});

export const heroSlideSchema = z.object({
  heading: z.string().max(180).default(''),
  description: z.string().max(500).default(''),
  buttonLabel: z.string().max(60).default(''),
  buttonLink: z.string().max(300).default(''),
  image: z.object({
    url: z.string().url('A valid Cloudinary slide image is required.'),
    publicId: z.string().min(1, 'Cloudinary public ID is required.'),
    alt: z.string().max(250).default(''),
    width: z.number().nonnegative().optional().default(0),
    height: z.number().nonnegative().optional().default(0),
  }),
  order: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  status: z.enum(['draft', 'published']).default('published'),
});

export const reorderSlidesSchema = z.object({
  slideIds: z.array(z.string().min(1)).min(1).max(100),
});

export const sermonSchema = z.object({
  title: z.string().min(2, 'Sermon title is required.').max(200),
  description: z.string().max(10000).default(''),
  sermonDate: z.string().min(4, 'Sermon date is required.'),
  preacher: z.string().max(140).default('Prophet Victor A.Y.'),
  seriesName: z.string().max(140).default(''),
  scriptureReference: z.string().max(180).default(''),
  youtubeUrl: z.string().max(600).default(''),
  audioUrl: z.string().max(800).default(''),
  thumbnail: cloudImageSchema,
  isFeatured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const eventSchema = z.object({
  title: z.string().min(2, 'Event title is required.').max(200),
  description: z.string().min(5, 'Event description is required.').max(15000),
  eventDate: z.string().min(4, 'Event date is required.'),
  endDate: z.string().optional().nullable().default(null),
  eventTime: z.string().max(100).default(''),
  location: z.string().max(240).default(''),
  registrationLink: z.string().max(600).default(''),
  enableInternalRegistration: z.boolean().default(false),
  image: cloudImageSchema,
  isFeatured: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const bookSchema = z.object({
  title: z.string().min(2, 'Book title is required.').max(200),
  subtitle: z.string().max(220).default(''),
  author: z.string().min(2, 'Author is required.').max(140).default('Prophet Victor A.Y.'),
  description: z.string().min(5, 'Book description is required.').max(12000),
  publicationYear: z.string().max(20).default(''),
  purchaseLink: z.string().max(600).default(''),
  coverImage: cloudImageSchema,
  isFeatured: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const galleryImageSchema = z.object({
  title: z.string().min(1, 'Image title is required.').max(160),
  description: z.string().max(1000).default(''),
  category: z.string().min(1, 'Category is required.').max(80).default('Ministry'),
  image: z.object({
    url: z.string().url('A valid Cloudinary image URL is required.'),
    publicId: z.string().min(1, 'Cloudinary public ID is required.'),
    alt: z.string().max(250).default(''),
    width: z.number().nonnegative().optional().default(0),
    height: z.number().nonnegative().optional().default(0),
  }),
  isFeatured: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
  status: z.enum(['draft', 'published']).default('published'),
});

export const testimonySchema = z.object({
  personName: z.string().min(2, 'Name is required.').max(140),
  personContext: z.string().max(160).default(''),
  title: z.string().max(180).default(''),
  content: z.string().min(10, 'Testimony content is required.').max(8000),
  image: cloudImageSchema,
  isApproved: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const blogPostSchema = z.object({
  title: z.string().min(2, 'Article title is required.').max(220),
  excerpt: z.string().max(450).default(''),
  content: z.string().min(10, 'Article content is required.').max(60000),
  category: z.string().min(2).max(80).default('Devotional'),
  author: z.string().min(2).max(140).default('Prophet Victor A.Y.'),
  scriptureReference: z.string().max(180).default(''),
  featuredImage: cloudImageSchema,
  publishedAt: z.string().optional().nullable().default(null),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const publicPrayerRequestSchema = z.object({
  requesterName: z.string().min(2, 'Please provide your name.').max(140),
  email: z
    .string()
    .max(180)
    .optional()
    .default('')
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'Please provide a valid email address.',
    }),
  phone: z.string().max(50).optional().default(''),
  subject: z.string().max(180).optional().default(''),
  requestText: z.string().min(10, 'Please share your prayer request (at least 10 characters).').max(4000),
  isConfidential: z.boolean().optional().default(true),
});

export const publicContactSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.').max(140),
  email: z.string().email('Please enter a valid email address.').max(180),
  phone: z.string().max(50).optional().default(''),
  subject: z.string().min(2, 'Please enter a subject.').max(200),
  message: z.string().min(10, 'Please enter your message (at least 10 characters).').max(4000),
});

export const publicInvitationSchema = z.object({
  fullName: z.string().min(2, 'Please enter the contact person name.').max(140),
  email: z.string().email('Please enter a valid email address.').max(180),
  phone: z.string().min(5, 'Please provide a contact telephone number.').max(50),
  ministryOrOrganization: z.string().min(2, 'Please enter the inviting church or organisation.').max(180),
  proposedDate: z.string().min(2, 'Please enter the proposed programme date(s).').max(100),
  eventLocation: z.string().min(2, 'Please enter the city, venue, and country.').max(200),
  subject: z.string().max(200).optional().default('Preaching / Ministry Invitation'),
  message: z.string().min(15, 'Please provide details about the programme and invitation.').max(4000),
});

export const publicEventRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.').max(140),
  email: z.string().email('Please enter a valid email address.').max(180),
  phone: z.string().max(50).optional().default(''),
  message: z.string().max(1000).optional().default('Event Registration'),
});

export const reviewStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed']),
});
