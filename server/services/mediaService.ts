import { destroyCloudinaryAsset } from '../config/cloudinary.ts';
import {
  BlogPost,
  Book,
  Event,
  GalleryImage,
  HeroSlide,
  HomepageSection,
  MediaAsset,
  PastorProfile,
  Sermon,
  Testimony,
  WebsiteSettings,
} from '../models/index.ts';

/**
 * Counts how many database records across ALL collections reference a given Cloudinary publicId.
 * Guarantees we NEVER delete a Cloudinary asset that is still being used by another section.
 */
export async function countPublicIdReferences(publicId: string): Promise<number> {
  if (!publicId || !publicId.trim()) {
    return 0;
  }

  const trimmed = publicId.trim();

  const counts = await Promise.all([
    PastorProfile.countDocuments({
      $or: [{ 'profilePhoto.publicId': trimmed }, { 'secondaryPhoto.publicId': trimmed }],
    }),
    WebsiteSettings.countDocuments({ 'ogImage.publicId': trimmed }),
    HomepageSection.countDocuments({ 'heroBackgroundImage.publicId': trimmed }),
    HeroSlide.countDocuments({ 'image.publicId': trimmed }),
    Sermon.countDocuments({ 'thumbnail.publicId': trimmed }),
    Event.countDocuments({ 'image.publicId': trimmed }),
    Book.countDocuments({ 'coverImage.publicId': trimmed }),
    GalleryImage.countDocuments({ 'image.publicId': trimmed }),
    Testimony.countDocuments({ 'image.publicId': trimmed }),
    BlogPost.countDocuments({ 'featuredImage.publicId': trimmed }),
  ]);

  return counts.reduce((sum, n) => sum + n, 0);
}

/**
 * Safely cleans up an old Cloudinary image AFTER its parent record has been updated or deleted.
 * If any other collection or document still references this publicId, it is preserved untouched.
 */
export async function cleanupUnusedMediaAsset(publicId?: string | null): Promise<boolean> {
  if (!publicId || !publicId.trim()) {
    return false;
  }

  const trimmed = publicId.trim();
  const refCount = await countPublicIdReferences(trimmed);

  if (refCount > 0) {
    return false;
  }

  const destroyed = await destroyCloudinaryAsset(trimmed);
  if (destroyed) {
    await MediaAsset.deleteOne({ publicId: trimmed });
  }
  return destroyed;
}
