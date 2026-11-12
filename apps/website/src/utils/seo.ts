export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  robots: string;
  ogUrl?: string;
}

const SITE_ORIGIN = 'https://maulanaazadlibraryamu.in';

export const HOME_SEO: SeoMetadata = {
  title: 'Maulana Azad Library | AMU Digital Library & Visitor Archive',
  description:
    "Explore Maulana Azad Library, AMU — featuring Lytton to Maulana Azad Library by Prof. (Dr.) Shabahat Husain and the 1877–2008 Visitors' Book Archive.",
  canonicalUrl: `${SITE_ORIGIN}/`,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  ogUrl: `${SITE_ORIGIN}/`,
};

export const EBOOK_READER_SEO: SeoMetadata = {
  title: 'Digital Manuscript Reader | Maulana Azad Library',
  description:
    'Protected digital e-book reader for Lytton to Maulana Azad Library (Vision and Mission) by Prof. (Dr.) Shabahat Husain.',
  robots: 'noindex, nofollow, noarchive',
  ogUrl: `${SITE_ORIGIN}/ebook`,
};

export const NOT_FOUND_SEO: SeoMetadata = {
  title: 'Page Not Found (404) | Maulana Azad Library',
  description:
    'The requested page could not be found in the Maulana Azad Library Digital Archive.',
  robots: 'noindex, nofollow',
};

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonicalLink(url?: string) {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (url) {
    if (existing) {
      existing.setAttribute('href', url);
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      document.head.appendChild(link);
    }
  } else if (existing) {
    existing.remove();
  }
}

export function applySeoMetadata(meta: SeoMetadata) {
  if (typeof document === 'undefined') return;

  document.title = meta.title;
  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'robots', meta.robots);

  setCanonicalLink(meta.canonicalUrl);

  upsertMetaTag('property', 'og:title', meta.title);
  upsertMetaTag('property', 'og:description', meta.description);
  if (meta.ogUrl) {
    upsertMetaTag('property', 'og:url', meta.ogUrl);
  }

  upsertMetaTag('name', 'twitter:title', meta.title);
  upsertMetaTag('name', 'twitter:description', meta.description);
}

