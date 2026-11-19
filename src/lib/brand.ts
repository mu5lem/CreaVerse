// Central brand config — edit these values to re-skin the whole app.
const envSite = (import.meta.env?.VITE_SITE_URL as string | undefined)?.trim().replace(/\/+$/, "");

export const brand = {
  name: "CreaVerse",
  /** Public site URL used in canonical/OG/sitemap. Set VITE_SITE_URL when deploying to your own domain. */
  siteUrl: envSite || "https://spark-creaverse.lovable.app",
  tagline: "Learn, Visualize, and Build Things",
  shortPitch: "A learning universe for everyone",
  fullPitch:
    "A modern learning platform where students, teachers, and creators come together to learn, visualize, and build.",
  og: {
    title: "CreaVerse — Education for Everyone",
    description: "Learn, Visualize, and Build Things.",
  },
} as const;
