import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

type Props = {
  /** Page-specific title (suffix " — Guzo" added automatically) */
  title?: string;
  /** Short description used for meta + OG + Twitter */
  description?: string;
  /** Absolute or root-relative image URL for OG/Twitter cards */
  image?: string;
  /** og:type — "article" for posts, "website" for landing/list, "music.song" for mezmurs… */
  type?: "website" | "article" | "music.song" | "product" | "profile";
  /** Optional canonical URL; defaults to current location at runtime */
  url?: string;
};

/**
 * Per-page Open Graph / Twitter / SEO meta. Drop-in component for any page.
 * Uses i18n for localized site name + default description so titles stay
 * culturally correct across am/en.
 */
export function SeoHead({
  title,
  description,
  image,
  type = "website",
  url,
}: Props) {
  const { t, i18n } = useTranslation();

  const siteName = t("app.name", { defaultValue: "Guzo" });
  const fallbackDesc = t("app.description", {
    defaultValue:
      "Discover the ancient path of Ethiopian Orthodox Christianity.",
  });

  const fullTitle = title ? `${title} — ${siteName}` : `${siteName} — ${t("app.tagline", { defaultValue: "Orthodox Tewahedo Journey" })}`;
  const desc = description?.trim() || fallbackDesc;
  const canonical =
    url ||
    (typeof window !== "undefined" ? window.location.href : undefined);
  const ogImage = image || "/og-default.jpg";

  return (
    <Helmet prioritizeSeoTags>
      <html lang={i18n.language || "am"} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:locale" content={i18n.language === "am" ? "am_ET" : "en_US"} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
