import { Router, type Response } from 'express';
import mongoose, { type Model } from 'mongoose';
import { createSignedUploadParams, validateUploadRequest } from '../config/cloudinary.ts';
import { isCloudinaryConfigured } from '../config/env.ts';
import {
  requireAdmin,
  requireDatabase,
  verifyCsrf,
  type AuthenticatedRequest,
} from '../middleware/security.ts';
import {
  BlogPost,
  Book,
  Event,
  GalleryImage,
  HeroSlide,
  HomepageSection,
  InquirySubmission,
  MediaAsset,
  NewsletterSubscriber,
  PastorProfile,
  PrayerRequest,
  Sermon,
  Testimony,
  WebsiteSettings,
} from '../models/index.ts';
import { cleanupUnusedMediaAsset } from '../services/mediaService.ts';
import {
  blogPostSchema,
  bookSchema,
  eventSchema,
  formatZodError,
  galleryImageSchema,
  heroSlideSchema,
  homepageSectionSchema,
  pastorProfileSchema,
  registerMediaSchema,
  reorderSlidesSchema,
  reviewStatusSchema,
  sermonSchema,
  signUploadSchema,
  slugify,
  testimonySchema,
  websiteSettingsSchema,
} from '../validators/schemas.ts';

const router = Router();

// Every administrative endpoint enforces authenticated admin session, DB readiness, and CSRF protection
router.use(requireAdmin, requireDatabase, verifyCsrf);

// Helper to create collision-free SEO slugs
async function generateUniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  title: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(title) || `item-${Date.now()}`;
  let candidate = base;
  let counter = 2;

  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }
    const exists = await model.exists(query);
    if (!exists) {
      return candidate;
    }
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

// 1. DASHBOARD OVERVIEW
router.get('/overview', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalSlides,
      activeSlides,
      totalSermons,
      publishedSermons,
      totalEvents,
      upcomingEvents,
      totalBooks,
      publishedBooks,
      totalGallery,
      totalTestimonies,
      publishedTestimonies,
      totalBlogPosts,
      publishedBlogPosts,
      pendingPrayers,
      totalPrayers,
      pendingInquiries,
      totalMedia,
      activeSubscribers,
    ] = await Promise.all([
      HeroSlide.countDocuments(),
      HeroSlide.countDocuments({ status: 'published', isActive: true }),
      Sermon.countDocuments(),
      Sermon.countDocuments({ status: 'published' }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'published', isArchived: false }),
      Book.countDocuments(),
      Book.countDocuments({ status: 'published' }),
      GalleryImage.countDocuments(),
      Testimony.countDocuments(),
      Testimony.countDocuments({ status: 'published', isApproved: true }),
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: 'published' }),
      PrayerRequest.countDocuments({ status: 'pending' }),
      PrayerRequest.countDocuments(),
      InquirySubmission.countDocuments({ status: 'pending' }),
      MediaAsset.countDocuments(),
      NewsletterSubscriber.countDocuments({ status: 'active' }),
    ]);

    res.json({
      stats: {
        totalSlides,
        activeSlides,
        totalSermons,
        publishedSermons,
        totalEvents,
        upcomingEvents,
        totalBooks,
        publishedBooks,
        totalGallery,
        totalTestimonies,
        publishedTestimonies,
        totalBlogPosts,
        publishedBlogPosts,
        pendingPrayers,
        totalPrayers,
        pendingInquiries,
        totalMedia,
        activeSubscribers,
      },
      services: {
        databaseConnected: true,
        cloudinaryConfigured: isCloudinaryConfigured(),
      },
    });
  } catch (err) {
    console.error('[Admin] Overview error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to load dashboard overview.' });
  }
});

// 2. SIGNED CLOUDINARY MEDIA MANAGEMENT
router.post('/media/sign-upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isCloudinaryConfigured()) {
      res.status(503).json({
        error:
          'Cloudinary image storage is not configured yet. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.',
        code: 'CLOUDINARY_UNAVAILABLE',
      });
      return;
    }

    const parsed = signUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const validation = validateUploadRequest(parsed.data);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const signed = createSignedUploadParams(parsed.data.folder);
    res.json(signed);
  } catch (err) {
    console.error('[Admin] Sign upload error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to generate secure upload signature.' });
  }
});

router.post('/media/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = registerMediaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const asset = await MediaAsset.findOneAndUpdate(
      { publicId: parsed.data.publicId },
      {
        $set: {
          url: parsed.data.url,
          publicId: parsed.data.publicId,
          folder: parsed.data.folder,
          format: parsed.data.format,
          bytes: parsed.data.bytes,
          width: parsed.data.width,
          height: parsed.data.height,
          alt: parsed.data.alt,
          uploadedBy: req.admin!.id,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    ).lean();

    res.status(201).json({ asset });
  } catch (err) {
    console.error('[Admin] Media registration error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to register uploaded media in database.' });
  }
});

router.get('/media', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const assets = await MediaAsset.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ assets });
  } catch {
    res.status(500).json({ error: 'Unable to load media library.' });
  }
});

// 3. PROFILE & ABOUT THE PASTOR MANAGEMENT
router.get('/profile', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    let profile = await PastorProfile.findOne({ key: 'primary' }).lean();
    if (!profile) {
      const created = await PastorProfile.create({ key: 'primary' });
      profile = created.toObject();
    }
    res.json({ profile });
  } catch {
    res.status(500).json({ error: 'Unable to load pastor profile.' });
  }
});

router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = pastorProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await PastorProfile.findOne({ key: 'primary' }).lean();
    const oldPrimaryPublicId = existing?.profilePhoto?.publicId || '';
    const oldSecondaryPublicId = existing?.secondaryPhoto?.publicId || '';

    const updated = await PastorProfile.findOneAndUpdate(
      { key: 'primary' },
      { $set: { ...parsed.data, key: 'primary' } },
      { upsert: true, returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldPrimaryPublicId && oldPrimaryPublicId !== parsed.data.profilePhoto.publicId) {
      await cleanupUnusedMediaAsset(oldPrimaryPublicId);
    }
    if (
      oldSecondaryPublicId &&
      oldSecondaryPublicId !== (parsed.data.secondaryPhoto?.publicId || '')
    ) {
      await cleanupUnusedMediaAsset(oldSecondaryPublicId);
    }

    res.json({ profile: updated, message: 'Pastor profile updated.' });
  } catch (err) {
    console.error('[Admin] Profile update error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to save pastor profile.' });
  }
});

// 4. WEBSITE SETTINGS, CONTACT INFORMATION & SOCIAL LINKS
router.get('/settings', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    let settings = await WebsiteSettings.findOne({ key: 'global' }).lean();
    if (!settings) {
      const created = await WebsiteSettings.create({ key: 'global' });
      settings = created.toObject();
    }
    res.json({ settings });
  } catch {
    res.status(500).json({ error: 'Unable to load website settings.' });
  }
});

router.put('/settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = websiteSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await WebsiteSettings.findOne({ key: 'global' }).lean();
    const oldOgPublicId = existing?.ogImage?.publicId || '';

    const updated = await WebsiteSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: { ...parsed.data, key: 'global' } },
      { upsert: true, returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldOgPublicId && oldOgPublicId !== (parsed.data.ogImage?.publicId || '')) {
      await cleanupUnusedMediaAsset(oldOgPublicId);
    }

    res.json({ settings: updated, message: 'Website settings saved.' });
  } catch (err) {
    console.error('[Admin] Settings update error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to save website settings.' });
  }
});

// 5. HOMEPAGE MANAGEMENT
router.get('/homepage', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    let homepage = await HomepageSection.findOne({ key: 'home' }).lean();
    if (!homepage) {
      const created = await HomepageSection.create({ key: 'home' });
      homepage = created.toObject();
    }
    res.json({ homepage });
  } catch {
    res.status(500).json({ error: 'Unable to load homepage settings.' });
  }
});

router.put('/homepage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = homepageSectionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await HomepageSection.findOne({ key: 'home' }).lean();
    const oldHeroBgId = existing?.heroBackgroundImage?.publicId || '';

    const validSermonIds = parsed.data.featuredSermonIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    const validEventIds = parsed.data.featuredEventIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const updated = await HomepageSection.findOneAndUpdate(
      { key: 'home' },
      {
        $set: {
          ...parsed.data,
          featuredSermonIds: validSermonIds,
          featuredEventIds: validEventIds,
          key: 'home',
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldHeroBgId && oldHeroBgId !== (parsed.data.heroBackgroundImage?.publicId || '')) {
      await cleanupUnusedMediaAsset(oldHeroBgId);
    }

    res.json({ homepage: updated, message: 'Homepage configuration updated.' });
  } catch (err) {
    console.error('[Admin] Homepage update error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to save homepage configuration.' });
  }
});

// 6. HERO SLIDER MANAGEMENT (Create, Read, Edit, Delete, Drag-and-Drop Reorder, Activate/Publish)
router.get('/slides', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json({ slides });
  } catch {
    res.status(500).json({ error: 'Unable to load hero slides.' });
  }
});

router.post('/slides', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = heroSlideSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const count = await HeroSlide.countDocuments();
    const slide = await HeroSlide.create({
      ...parsed.data,
      order: parsed.data.order ?? count,
    });

    res.status(201).json({ slide, message: 'Slide added.' });
  } catch (err) {
    console.error('[Admin] Create slide error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to create hero slide.' });
  }
});

router.put('/slides/reorder', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = reorderSlidesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const ops = parsed.data.slideIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id, idx) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: { $set: { order: idx } },
        },
      }));

    if (ops.length > 0) {
      await HeroSlide.bulkWrite(ops);
    }

    const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json({ slides, message: 'Slide order updated.' });
  } catch (err) {
    console.error('[Admin] Reorder slides error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to reorder slides.' });
  }
});

router.put('/slides/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid slide ID.' });
      return;
    }

    const parsed = heroSlideSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await HeroSlide.findById(req.params.id).lean();
    if (!existing) {
      res.status(404).json({ error: 'Slide not found.' });
      return;
    }

    const oldPublicId = existing.image?.publicId || '';
    const updated = await HeroSlide.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldPublicId && oldPublicId !== parsed.data.image.publicId) {
      await cleanupUnusedMediaAsset(oldPublicId);
    }

    res.json({ slide: updated, message: 'Slide updated.' });
  } catch (err) {
    console.error('[Admin] Update slide error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to update slide.' });
  }
});

router.delete('/slides/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid slide ID.' });
      return;
    }

    const deleted = await HeroSlide.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Slide not found.' });
      return;
    }

    if (deleted.image?.publicId) {
      await cleanupUnusedMediaAsset(deleted.image.publicId);
    }

    res.json({ success: true, message: 'Slide deleted.' });
  } catch (err) {
    console.error('[Admin] Delete slide error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to delete slide.' });
  }
});

// 7. SERMON MANAGEMENT
router.get('/sermons', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const sermons = await Sermon.find().sort({ sermonDate: -1, createdAt: -1 }).lean();
    res.json({ sermons });
  } catch {
    res.status(500).json({ error: 'Unable to load sermons.' });
  }
});

router.post('/sermons', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = sermonSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const slug = await generateUniqueSlug(Sermon, parsed.data.title);
    const sermon = await Sermon.create({
      ...parsed.data,
      slug,
      sermonDate: new Date(parsed.data.sermonDate),
    });

    res.status(201).json({ sermon, message: 'Sermon saved.' });
  } catch (err) {
    console.error('[Admin] Create sermon error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to create sermon.' });
  }
});

router.put('/sermons/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid sermon ID.' });
      return;
    }

    const parsed = sermonSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await Sermon.findById(req.params.id).lean();
    if (!existing) {
      res.status(404).json({ error: 'Sermon not found.' });
      return;
    }

    const slug =
      existing.title === parsed.data.title
        ? existing.slug
        : await generateUniqueSlug(Sermon, parsed.data.title, req.params.id);

    const oldPublicId = existing.thumbnail?.publicId || '';

    const updated = await Sermon.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...parsed.data,
          slug,
          sermonDate: new Date(parsed.data.sermonDate),
        },
      },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldPublicId && oldPublicId !== parsed.data.thumbnail.publicId) {
      await cleanupUnusedMediaAsset(oldPublicId);
    }

    res.json({ sermon: updated, message: 'Sermon updated.' });
  } catch (err) {
    console.error('[Admin] Update sermon error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to update sermon.' });
  }
});

router.delete('/sermons/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid sermon ID.' });
      return;
    }

    const deleted = await Sermon.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Sermon not found.' });
      return;
    }

    await HomepageSection.updateMany(
      {},
      { $pull: { featuredSermonIds: new mongoose.Types.ObjectId(req.params.id) } }
    );

    if (deleted.thumbnail?.publicId) {
      await cleanupUnusedMediaAsset(deleted.thumbnail.publicId);
    }

    res.json({ success: true, message: 'Sermon deleted.' });
  } catch (err) {
    console.error('[Admin] Delete sermon error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to delete sermon.' });
  }
});

// 8. EVENT MANAGEMENT
router.get('/events', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const events = await Event.find().sort({ eventDate: -1, createdAt: -1 }).lean();
    res.json({ events });
  } catch {
    res.status(500).json({ error: 'Unable to load events.' });
  }
});

router.post('/events', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const slug = await generateUniqueSlug(Event, parsed.data.title);
    const event = await Event.create({
      ...parsed.data,
      slug,
      eventDate: new Date(parsed.data.eventDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    });

    res.status(201).json({ event, message: 'Event saved.' });
  } catch (err) {
    console.error('[Admin] Create event error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to create event.' });
  }
});

router.put('/events/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid event ID.' });
      return;
    }

    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await Event.findById(req.params.id).lean();
    if (!existing) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const slug =
      existing.title === parsed.data.title
        ? existing.slug
        : await generateUniqueSlug(Event, parsed.data.title, req.params.id);

    const oldPublicId = existing.image?.publicId || '';

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...parsed.data,
          slug,
          eventDate: new Date(parsed.data.eventDate),
          endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        },
      },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldPublicId && oldPublicId !== parsed.data.image.publicId) {
      await cleanupUnusedMediaAsset(oldPublicId);
    }

    res.json({ event: updated, message: 'Event updated.' });
  } catch (err) {
    console.error('[Admin] Update event error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to update event.' });
  }
});

router.delete('/events/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid event ID.' });
      return;
    }

    const deleted = await Event.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    await HomepageSection.updateMany(
      {},
      { $pull: { featuredEventIds: new mongoose.Types.ObjectId(req.params.id) } }
    );

    if (deleted.image?.publicId) {
      await cleanupUnusedMediaAsset(deleted.image.publicId);
    }

    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    console.error('[Admin] Delete event error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to delete event.' });
  }
});

// 9. BOOKS & PUBLICATIONS MANAGEMENT
router.get('/books', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const books = await Book.find().sort({ order: 1, createdAt: -1 }).lean();
    res.json({ books });
  } catch {
    res.status(500).json({ error: 'Unable to load books.' });
  }
});

router.post('/books', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = bookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const slug = await generateUniqueSlug(Book, parsed.data.title);
    const book = await Book.create({ ...parsed.data, slug });
    res.status(201).json({ book, message: 'Publication added.' });
  } catch (err) {
    console.error('[Admin] Create book error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to add publication.' });
  }
});

router.put('/books/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid book ID.' });
      return;
    }

    const parsed = bookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await Book.findById(req.params.id).lean();
    if (!existing) {
      res.status(404).json({ error: 'Publication not found.' });
      return;
    }

    const slug =
      existing.title === parsed.data.title
        ? existing.slug
        : await generateUniqueSlug(Book, parsed.data.title, req.params.id);

    const oldPublicId = existing.coverImage?.publicId || '';
    const updated = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: { ...parsed.data, slug } },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldPublicId && oldPublicId !== parsed.data.coverImage.publicId) {
      await cleanupUnusedMediaAsset(oldPublicId);
    }

    res.json({ book: updated, message: 'Publication updated.' });
  } catch (err) {
    console.error('[Admin] Update book error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to update publication.' });
  }
});

router.delete('/books/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid book ID.' });
      return;
    }

    const deleted = await Book.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Publication not found.' });
      return;
    }

    if (deleted.coverImage?.publicId) {
      await cleanupUnusedMediaAsset(deleted.coverImage.publicId);
    }

    res.json({ success: true, message: 'Publication deleted.' });
  } catch (err) {
    console.error('[Admin] Delete book error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to delete publication.' });
  }
});

// 10. GALLERY MANAGEMENT
router.get('/gallery', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const images = await GalleryImage.find().sort({ isFeatured: -1, order: 1, createdAt: -1 }).lean();
    res.json({ images });
  } catch {
    res.status(500).json({ error: 'Unable to load gallery images.' });
  }
});

router.post('/gallery', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = galleryImageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const image = await GalleryImage.create(parsed.data);
    res.status(201).json({ image, message: 'Gallery photograph saved.' });
  } catch (err) {
    console.error('[Admin] Create gallery image error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to add gallery photograph.' });
  }
});

router.put('/gallery/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid gallery image ID.' });
      return;
    }

    const parsed = galleryImageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await GalleryImage.findById(req.params.id).lean();
    if (!existing) {
      res.status(404).json({ error: 'Gallery photograph not found.' });
      return;
    }

    const oldPublicId = existing.image?.publicId || '';
    const updated = await GalleryImage.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldPublicId && oldPublicId !== parsed.data.image.publicId) {
      await cleanupUnusedMediaAsset(oldPublicId);
    }

    res.json({ image: updated, message: 'Gallery photograph updated.' });
  } catch (err) {
    console.error('[Admin] Update gallery image error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to update gallery photograph.' });
  }
});

router.delete('/gallery/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid gallery image ID.' });
      return;
    }

    const deleted = await GalleryImage.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Gallery photograph not found.' });
      return;
    }

    if (deleted.image?.publicId) {
      await cleanupUnusedMediaAsset(deleted.image.publicId);
    }

    res.json({ success: true, message: 'Gallery photograph deleted.' });
  } catch (err) {
    console.error('[Admin] Delete gallery image error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to delete gallery photograph.' });
  }
});

// 11. TESTIMONY MANAGEMENT
router.get('/testimonies', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const testimonies = await Testimony.find().sort({ createdAt: -1 }).lean();
    res.json({ testimonies });
  } catch {
    res.status(500).json({ error: 'Unable to load testimonies.' });
  }
});

router.post('/testimonies', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = testimonySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const testimony = await Testimony.create(parsed.data);
    res.status(201).json({ testimony, message: 'Testimony added.' });
  } catch (err) {
    console.error('[Admin] Create testimony error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to save testimony.' });
  }
});

router.put('/testimonies/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid testimony ID.' });
      return;
    }

    const parsed = testimonySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await Testimony.findById(req.params.id).lean();
    if (!existing) {
      res.status(404).json({ error: 'Testimony not found.' });
      return;
    }

    const oldPublicId = existing.image?.publicId || '';
    const updated = await Testimony.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldPublicId && oldPublicId !== parsed.data.image.publicId) {
      await cleanupUnusedMediaAsset(oldPublicId);
    }

    res.json({ testimony: updated, message: 'Testimony updated.' });
  } catch (err) {
    console.error('[Admin] Update testimony error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to update testimony.' });
  }
});

router.delete('/testimonies/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid testimony ID.' });
      return;
    }

    const deleted = await Testimony.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Testimony not found.' });
      return;
    }

    if (deleted.image?.publicId) {
      await cleanupUnusedMediaAsset(deleted.image.publicId);
    }

    res.json({ success: true, message: 'Testimony deleted.' });
  } catch (err) {
    console.error('[Admin] Delete testimony error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to delete testimony.' });
  }
});

// 12. BLOG & DEVOTIONALS MANAGEMENT
router.get('/blog', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
    res.json({ posts });
  } catch {
    res.status(500).json({ error: 'Unable to load articles.' });
  }
});

router.post('/blog', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = blogPostSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const slug = await generateUniqueSlug(BlogPost, parsed.data.title);
    const publishedAt =
      parsed.data.status === 'published'
        ? parsed.data.publishedAt
          ? new Date(parsed.data.publishedAt)
          : new Date()
        : null;

    const post = await BlogPost.create({
      ...parsed.data,
      slug,
      publishedAt,
    });

    res.status(201).json({ post, message: 'Article saved.' });
  } catch (err) {
    console.error('[Admin] Create blog post error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to create article.' });
  }
});

router.put('/blog/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid article ID.' });
      return;
    }

    const parsed = blogPostSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const existing = await BlogPost.findById(req.params.id).lean();
    if (!existing) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    const slug =
      existing.title === parsed.data.title
        ? existing.slug
        : await generateUniqueSlug(BlogPost, parsed.data.title, req.params.id);

    const publishedAt =
      parsed.data.status === 'published'
        ? parsed.data.publishedAt
          ? new Date(parsed.data.publishedAt)
          : existing.publishedAt || new Date()
        : existing.publishedAt;

    const oldPublicId = existing.featuredImage?.publicId || '';
    const updated = await BlogPost.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...parsed.data,
          slug,
          publishedAt,
        },
      },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (oldPublicId && oldPublicId !== parsed.data.featuredImage.publicId) {
      await cleanupUnusedMediaAsset(oldPublicId);
    }

    res.json({ post: updated, message: 'Article updated.' });
  } catch (err) {
    console.error('[Admin] Update blog post error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to update article.' });
  }
});

router.delete('/blog/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid article ID.' });
      return;
    }

    const deleted = await BlogPost.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    if (deleted.featuredImage?.publicId) {
      await cleanupUnusedMediaAsset(deleted.featuredImage.publicId);
    }

    res.json({ success: true, message: 'Article deleted.' });
  } catch (err) {
    console.error('[Admin] Delete blog post error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to delete article.' });
  }
});

// 13. PRAYER REQUEST MANAGEMENT (Strictly Private)
router.get('/prayer-requests', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = await PrayerRequest.find().sort({ status: 1, createdAt: -1 }).lean();
    res.json({ requests });
  } catch {
    res.status(500).json({ error: 'Unable to load prayer requests.' });
  }
});

router.patch('/prayer-requests/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid prayer request ID.' });
      return;
    }

    const parsed = reviewStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const updated = await PrayerRequest.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: parsed.data.status,
          reviewedAt: parsed.data.status === 'reviewed' ? new Date() : null,
          reviewedBy: parsed.data.status === 'reviewed' ? req.admin!.id : null,
        },
      },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: 'Prayer request not found.' });
      return;
    }

    res.json({ request: updated, message: 'Prayer request status updated.' });
  } catch {
    res.status(500).json({ error: 'Unable to update prayer request.' });
  }
});

router.delete('/prayer-requests/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid prayer request ID.' });
      return;
    }

    const deleted = await PrayerRequest.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Prayer request not found.' });
      return;
    }

    res.json({ success: true, message: 'Prayer request deleted.' });
  } catch {
    res.status(500).json({ error: 'Unable to delete prayer request.' });
  }
});

// 14. PRIVATE CONTACT ENQUIRIES, PREACHING INVITATIONS & EVENT REGISTRATIONS
router.get('/inquiries', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const inquiries = await InquirySubmission.find().sort({ status: 1, createdAt: -1 }).lean();
    res.json({ inquiries });
  } catch {
    res.status(500).json({ error: 'Unable to load ministry enquiries.' });
  }
});

router.patch('/inquiries/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid enquiry ID.' });
      return;
    }

    const parsed = reviewStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const updated = await InquirySubmission.findByIdAndUpdate(
      req.params.id,
      { $set: { status: parsed.data.status } },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    res.json({ inquiry: updated, message: 'Submission status updated.' });
  } catch {
    res.status(500).json({ error: 'Unable to update submission.' });
  }
});

router.delete('/inquiries/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid enquiry ID.' });
      return;
    }

    const deleted = await InquirySubmission.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    res.json({ success: true, message: 'Submission deleted.' });
  } catch {
    res.status(500).json({ error: 'Unable to delete submission.' });
  }
});

// NEWSLETTER SUBSCRIBERS MANAGEMENT
router.get('/newsletter-subscribers', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const subscribers = await NewsletterSubscriber.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json({ subscribers });
  } catch {
    res.status(500).json({ error: 'Unable to retrieve newsletter subscribers.' });
  }
});

router.delete('/newsletter-subscribers/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid subscriber ID.' });
      return;
    }

    const deleted = await NewsletterSubscriber.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ error: 'Subscriber not found.' });
      return;
    }

    res.json({ success: true, message: 'Subscriber removed.' });
  } catch {
    res.status(500).json({ error: 'Unable to remove subscriber.' });
  }
});

export default router;
