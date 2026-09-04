import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const SITE_NAME = "Rollnexa";
export const SITE_DESCRIPTION =
  "Buy and sell heavy construction equipment with confidence on Rollnexa. Discover verified listings, trusted sellers, and premium machinery across the industry.";
export const DEFAULT_KEYWORDS = [
  "heavy equipment",
  "construction machinery",
  "used machinery",
  "equipment marketplace",
  "construction equipment",
  "buy machinery",
  "sell machinery",
];

const DEFAULT_OG_PATH = "/opengraph-image";

function normalizeBaseUrl(rawUrl?: string | null) {
  const resolved =
    rawUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000";
  return resolved.replace(/\/$/, "");
}

export function getSiteUrl() {
  return normalizeBaseUrl();
}

export function resolveUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(cleanPath, `${getSiteUrl()}/`).toString();
}

export function withAbsoluteImageUrl(image?: string | null) {
  if (!image) return resolveUrl(DEFAULT_OG_PATH);
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return resolveUrl(image);
  return image;
}

export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex = false,
  type = "website",
  keywords = [],
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article" | "profile";
  keywords?: string[];
}): Metadata {
  const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const resolvedDescription = description || SITE_DESCRIPTION;
  const canonicalUrl = resolveUrl(path);
  const resolvedImage = withAbsoluteImageUrl(image);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: resolvedTitle,
    description: resolvedDescription,
    keywords: [...DEFAULT_KEYWORDS, ...keywords].filter(Boolean).slice(0, 20),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: [
        {
          url: resolvedImage,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [resolvedImage],
    },
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: resolveUrl(DEFAULT_OG_PATH),
    description: SITE_DESCRIPTION,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@rollnexa.com",
      availableLanguage: ["English"],
    },
  };
}

export function buildWebsiteSchema(path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: resolveUrl(path),
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${resolveUrl("/machines")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebPageSchema(path: string, title: string, description?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: resolveUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path?: string; url?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url || (item.path ? resolveUrl(item.path) : undefined),
    })),
  };
}

export function buildCollectionPageSchema({
  path,
  name,
  description,
  itemCount,
}: {
  path: string;
  name: string;
  description?: string;
  itemCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: resolveUrl(path),
    ...(typeof itemCount === "number"
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: itemCount,
          },
        }
      : {}),
  };
}

export function buildProductSchema(machine: {
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  priceLabel?: string;
  brand: { name: string };
  category: { name: string };
  location?: string | null;
  year?: number | null;
  hours?: number | null;
  conditionLabel?: string;
  images: Array<{ url: string; alt?: string | null }>;
  seller: {
    name: string;
    companyName?: string | null;
    city?: string | null;
    country?: string | null;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  } | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: machine.title,
    description: machine.description || `${machine.title} available on Rollnexa.`,
    url: resolveUrl(`/machines/${machine.slug}`),
    image: machine.images.map((image) => withAbsoluteImageUrl(image.url)),
    sku: machine.slug,
    brand: {
      "@type": "Brand",
      name: machine.brand.name,
    },
    category: machine.category.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: machine.price,
      availability: "https://schema.org/InStock",
      url: resolveUrl(`/machines/${machine.slug}`),
      itemCondition:
        machine.conditionLabel?.toLowerCase() === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
      seller: {
        "@type": "Organization",
        name: machine.seller.companyName || machine.seller.name,
        address: {
          "@type": "PostalAddress",
          addressLocality: machine.seller.city || undefined,
          addressCountry: machine.seller.country || undefined,
        },
      },
    },
    ...(machine.aggregateRating && machine.aggregateRating.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(machine.aggregateRating.ratingValue.toFixed(1)),
            reviewCount: machine.aggregateRating.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Condition",
        value: machine.conditionLabel || "Used",
      },
      {
        "@type": "PropertyValue",
        name: "Year",
        value: machine.year?.toString() || "N/A",
      },
      {
        "@type": "PropertyValue",
        name: "Hours",
        value: machine.hours?.toString() || "N/A",
      },
      {
        "@type": "PropertyValue",
        name: "Location",
        value: machine.location || "Location not provided",
      },
    ],
  };
}

export function buildSellerSchema(seller: {
  name: string;
  companyName?: string | null;
  description?: string | null;
  city?: string | null;
  country?: string | null;
  image?: string | null;
  slug?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seller.companyName || seller.name,
    description:
      seller.description ||
      `${seller.companyName || seller.name} is a verified seller on Rollnexa.`,
    url: seller.slug ? resolveUrl(`/dealers/${seller.slug}`) : getSiteUrl(),
    address: {
      "@type": "PostalAddress",
      addressLocality: seller.city || undefined,
      addressCountry: seller.country || undefined,
    },
    image: seller.image ? withAbsoluteImageUrl(seller.image) : undefined,
  };
}

export async function getSeoPageData() {
  const [categoriesCount, brandsCount, machinesCount] = await Promise.all([
    prisma.category.count({ where: { machines: { some: { status: "PUBLISHED" } } } }),
    prisma.brand.count(),
    prisma.machine.count({ where: { status: "PUBLISHED" } }),
  ]);

  return {
    categoriesCount,
    brandsCount,
    machinesCount,
  };
}
