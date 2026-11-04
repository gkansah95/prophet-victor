import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { connectDatabase, isDatabaseConnected } from '../config/database.ts';
import { isMongoConfigured } from '../config/env.ts';
import { publicSubmissionRateLimiter, requireDatabase } from '../middleware/security.ts';
import {
  BlogPost,
  Book,
  Event,
  GalleryImage,
  HeroSlide,
  HomepageSection,
  InquirySubmission,
  PastorProfile,
  PrayerRequest,
  Sermon,
  Testimony,
  WebsiteSettings,
} from '../models/index.ts';
import {
  formatZodError,
  publicContactSchema,
  publicEventRegistrationSchema,
  publicInvitationSchema,
  publicPrayerRequestSchema,
} from '../validators/schemas.ts';

const router = Router();

// Verified non-fictional defaults strictly limited to supplied project facts
const VERIFIED_DEFAULTS = {
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
    profilePhoto: { url: '', publicId: '', alt: 'Prophet Victor A.Y.', width: 0, height: 0 },
    secondaryPhoto: { url: '', publicId: '', alt: '', width: 0, height: 0 },
    isPublished: true,
  },
  settings: {
    siteName: 'Global Seekers Chapel',
    pastorName: 'Prophet Victor A.Y.',
    slogan: 'Seeking God',
    seoTitle: 'Prophet Victor A.Y. – Global Seekers Chapel | Seeking God',
    seoDescription:
      'Official personal ministry website for Prophet Victor A.Y. and Global Seekers Chapel – Seeking God.',
    ogImage: { url: '', publicId: '', alt: 'Global Seekers Chapel', width: 0, height: 0 },
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
    heroBackgroundImage: { url: '', publicId: '', alt: '', width: 0, height: 0 },
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
};

async function ensureDbIfConfigured(): Promise<boolean> {
  if (!isMongoConfigured()) {
    return false;
  }
  if (isDatabaseConnected()) {
    return true;
  }
  return connectDatabase();
}

// Public Site Bootstrap (Published Content Only)
router.get('/bootstrap', async (_req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.json({
        dbConnected: false,
        profile: VERIFIED_DEFAULTS.profile,
        settings: VERIFIED_DEFAULTS.settings,
        homepage: VERIFIED_DEFAULTS.homepage,
        slides: [],
        featuredSermons: [],
        upcomingEvents: [],
        books: [],
        gallery: [],
        testimonies: [],
        latestPosts: [],
      });
      return;
    }

    const [profileDoc, settingsDoc, homepageDoc, slides] = await Promise.all([
      PastorProfile.findOne({ key: 'primary' }).lean(),
      WebsiteSettings.findOne({ key: 'global' }).lean(),
      HomepageSection.findOne({ key: 'home' }).lean(),
      HeroSlide.find({ status: 'published', isActive: true }).sort({ order: 1, createdAt: 1 }).lean(),
    ]);

    const homepage = homepageDoc || VERIFIED_DEFAULTS.homepage;

    // Resolve Featured Sermons (explicitly chosen by admin or latest published)
    let featuredSermons = [];
    if (homepageDoc?.featuredSermonIds && homepageDoc.featuredSermonIds.length > 0) {
      featuredSermons = await Sermon.find({
        _id: { $in: homepageDoc.featuredSermonIds },
        status: 'published',
      })
        .sort({ sermonDate: -1 })
        .limit(6)
        .lean();
    }
    if (featuredSermons.length === 0) {
      featuredSermons = await Sermon.find({ status: 'published' })
        .sort({ isFeatured: -1, sermonDate: -1 })
        .limit(6)
        .lean();
    }

    // Resolve Upcoming Events (explicitly chosen by admin or upcoming non-archived published)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let upcomingEvents = [];
    if (homepageDoc?.featuredEventIds && homepageDoc.featuredEventIds.length > 0) {
      upcomingEvents = await Event.find({
        _id: { $in: homepageDoc.featuredEventIds },
        status: 'published',
        isArchived: false,
      })
        .sort({ eventDate: 1 })
        .limit(6)
        .lean();
    }
    if (upcomingEvents.length === 0) {
      upcomingEvents = await Event.find({
        status: 'published',
        isArchived: false,
        $or: [{ eventDate: { $gte: startOfToday } }, { endDate: { $gte: startOfToday } }],
      })
        .sort({ isFeatured: -1, eventDate: 1 })
        .limit(6)
        .lean();
    }

    const [books, gallery, testimonies, latestPosts] = await Promise.all([
      Book.find({ status: 'published' }).sort({ isFeatured: -1, order: 1, createdAt: -1 }).limit(4).lean(),
      GalleryImage.find({ status: 'published' })
        .sort({ isFeatured: -1, order: 1, createdAt: -1 })
        .limit(8)
        .lean(),
      Testimony.find({ status: 'published', isApproved: true }).sort({ createdAt: -1 }).limit(6).lean(),
      BlogPost.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1 }).limit(3).lean(),
    ]);

    res.json({
      dbConnected: true,
      profile: profileDoc && profileDoc.isPublished ? profileDoc : VERIFIED_DEFAULTS.profile,
      settings: settingsDoc || VERIFIED_DEFAULTS.settings,
      homepage,
      slides,
      featuredSermons,
      upcomingEvents,
      books,
      gallery,
      testimonies,
      latestPosts,
    });
  } catch (err) {
    console.error('[Public] Bootstrap failed:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to load website content.' });
  }
});

router.get('/sermons', async (_req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.json({ sermons: [] });
      return;
    }
    const sermons = await Sermon.find({ status: 'published' }).sort({ sermonDate: -1, createdAt: -1 }).lean();
    res.json({ sermons });
  } catch {
    res.status(500).json({ error: 'Unable to load sermons.' });
  }
});

router.get('/sermons/:slug', async (req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.status(404).json({ error: 'Sermon not found.' });
      return;
    }
    const sermon = await Sermon.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!sermon) {
      res.status(404).json({ error: 'Sermon not found.' });
      return;
    }
    res.json({ sermon });
  } catch {
    res.status(500).json({ error: 'Unable to load sermon details.' });
  }
});

router.get('/events', async (_req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.json({ events: [], pastEvents: [] });
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const allPublished = await Event.find({ status: 'published' }).sort({ eventDate: 1 }).lean();
    const events = allPublished.filter(
      (ev) =>
        !ev.isArchived &&
        (new Date(ev.eventDate) >= startOfToday || (ev.endDate && new Date(ev.endDate) >= startOfToday))
    );
    const pastEvents = allPublished
      .filter(
        (ev) =>
          ev.isArchived ||
          (new Date(ev.eventDate) < startOfToday && (!ev.endDate || new Date(ev.endDate) < startOfToday))
      )
      .reverse();

    res.json({ events, pastEvents });
  } catch {
    res.status(500).json({ error: 'Unable to load events.' });
  }
});

router.get('/events/:slug', async (req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    const event = await Event.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    res.json({ event });
  } catch {
    res.status(500).json({ error: 'Unable to load event details.' });
  }
});

router.get('/books', async (_req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.json({ books: [] });
      return;
    }
    const books = await Book.find({ status: 'published' }).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ books });
  } catch {
    res.status(500).json({ error: 'Unable to load publications.' });
  }
});

router.get('/gallery', async (_req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.json({ images: [] });
      return;
    }
    const images = await GalleryImage.find({ status: 'published' })
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .lean();
    res.json({ images });
  } catch {
    res.status(500).json({ error: 'Unable to load gallery images.' });
  }
});

router.get('/testimonies', async (_req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.json({ testimonies: [] });
      return;
    }
    const testimonies = await Testimony.find({ status: 'published', isApproved: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ testimonies });
  } catch {
    res.status(500).json({ error: 'Unable to load testimonies.' });
  }
});

router.get('/blog', async (_req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.json({ posts: [] });
      return;
    }
    const posts = await BlogPost.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
    res.json({ posts });
  } catch {
    res.status(500).json({ error: 'Unable to load articles.' });
  }
});

router.get('/blog/:slug', async (req: Request, res: Response) => {
  try {
    const connected = await ensureDbIfConfigured();
    if (!connected) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!post) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    res.json({ post });
  } catch {
    res.status(500).json({ error: 'Unable to load article.' });
  }
});

// STRICTLY WRITE-ONLY PRIVATE SUBMISSIONS (Never exposed publicly)
router.post(
  '/prayer-requests',
  publicSubmissionRateLimiter,
  requireDatabase,
  async (req: Request, res: Response) => {
    try {
      const parsed = publicPrayerRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: formatZodError(parsed.error) });
        return;
      }

      await PrayerRequest.create({
        requesterName: parsed.data.requesterName,
        email: parsed.data.email || '',
        phone: parsed.data.phone || '',
        subject: parsed.data.subject || 'Prayer Request',
        requestText: parsed.data.requestText,
        isConfidential: parsed.data.isConfidential ?? true,
        status: 'pending',
      });

      res.status(201).json({
        success: true,
        message: 'Your prayer request has been received confidentially.',
      });
    } catch (err) {
      console.error('[Public] Prayer request submission failed:', err instanceof Error ? err.message : err);
      res.status(500).json({
        error: 'Unable to submit your prayer request at this time. Please try again later.',
      });
    }
  }
);

router.post(
  '/contact',
  publicSubmissionRateLimiter,
  requireDatabase,
  async (req: Request, res: Response) => {
    try {
      const parsed = publicContactSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: formatZodError(parsed.error) });
        return;
      }

      await InquirySubmission.create({
        type: 'contact',
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone || '',
        subject: parsed.data.subject,
        message: parsed.data.message,
        status: 'pending',
      });

      res.status(201).json({
        success: true,
        message: 'Thank you. Your enquiry has been delivered to the ministry office.',
      });
    } catch (err) {
      console.error('[Public] Contact submission failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Unable to send your message right now. Please try again later.' });
    }
  }
);

router.post(
  '/invitations',
  publicSubmissionRateLimiter,
  requireDatabase,
  async (req: Request, res: Response) => {
    try {
      const parsed = publicInvitationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: formatZodError(parsed.error) });
        return;
      }

      await InquirySubmission.create({
        type: 'invitation',
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        ministryOrOrganization: parsed.data.ministryOrOrganization,
        proposedDate: parsed.data.proposedDate,
        eventLocation: parsed.data.eventLocation,
        subject: parsed.data.subject || 'Preaching Invitation',
        message: parsed.data.message,
        status: 'pending',
      });

      res.status(201).json({
        success: true,
        message: 'Your ministry invitation has been submitted for pastoral review.',
      });
    } catch (err) {
      console.error('[Public] Invitation submission failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Unable to submit your ministry invitation right now.' });
    }
  }
);

router.post(
  '/events/:id/register',
  publicSubmissionRateLimiter,
  requireDatabase,
  async (req: Request, res: Response) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ error: 'Invalid event identifier.' });
        return;
      }

      const parsed = publicEventRegistrationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: formatZodError(parsed.error) });
        return;
      }

      const event = await Event.findOne({
        _id: req.params.id,
        status: 'published',
        isArchived: false,
        enableInternalRegistration: true,
      }).lean();

      if (!event) {
        res.status(404).json({ error: 'Registration is not open for this programme.' });
        return;
      }

      await InquirySubmission.create({
        type: 'event_registration',
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone || '',
        eventId: event._id,
        eventTitle: event.title,
        subject: `Registration: ${event.title}`,
        message: parsed.data.message || `Programme registration for ${event.title}`,
        status: 'pending',
      });

      res.status(201).json({
        success: true,
        message: `You are registered for ${event.title}.`,
      });
    } catch (err) {
      console.error('[Public] Event registration failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Unable to complete registration at this time.' });
    }
  }
);

export default router;
