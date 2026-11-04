import { useEffect } from 'react';
import { useSiteData } from '../../context/SiteDataContext';

interface SeoHeadProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  noIndex?: boolean;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function SeoHead({ title, description, imageUrl, noIndex = false }: SeoHeadProps) {
  const { siteData } = useSiteData();

  useEffect(() => {
    const baseSiteTitle =
      siteData.settings.seoTitle || 'Prophet Victor A.Y. – Global Seekers Chapel | Seeking God';
    const fullTitle = title ? `${title} | Global Seekers Chapel` : baseSiteTitle;
    const metaDesc =
      description ||
      siteData.settings.seoDescription ||
      'Official personal ministry website for Prophet Victor A.Y. and Global Seekers Chapel – Seeking God.';
    const resolvedOgImage = imageUrl || siteData.settings.ogImage?.url || '';
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;

    document.title = fullTitle;

    setMetaTag('name', 'description', metaDesc);
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', metaDesc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', metaDesc);

    if (resolvedOgImage) {
      setMetaTag('property', 'og:image', resolvedOgImage);
      setMetaTag('name', 'twitter:image', resolvedOgImage);
    }

    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);
  }, [title, description, imageUrl, noIndex, siteData.settings]);

  return null;
}
