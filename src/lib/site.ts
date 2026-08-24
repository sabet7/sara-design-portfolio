// Single source of truth for the site's canonical URL. Set the real value
// in .env.local and in Vercel's project env vars once the domain is live —
// everything SEO-related (metadataBase, sitemap, canonical URLs) reads
// from this so there's one place to update, not a dozen hardcoded strings.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saravillar.com";
export const SITE_NAME = "Sara del Villar";
