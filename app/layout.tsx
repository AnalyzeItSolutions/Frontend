import type { Metadata } from "next";
import "./globals.css";
import "./reducedMotion.css";
import { ThemeProvider } from "./Components/ui/ThemeProvider";
import { UIProvider } from "./Components/ui/UIProvider";
import { GlobeProvider } from "./Components/globe/GlobeProvider";
import { SmoothScrollProvider } from "./Components/ui/SmoothScrollProvider";
import { SkipToContent } from "./Components/ui/SkipToContent";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "./lib/site";
import { buildSessionBootScript } from "./lib/personalHost.mjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Outfit, Playfair_Display, Space_Mono } from "next/font/google";

// Self-hosted by next/font: no render-blocking request to fonts.googleapis.com.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter-nf", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit-nf", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-playfair-nf", display: "swap", preload: false });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-mono-nf", display: "swap", preload: false });

/** Public AdSense publisher ID — omit meta when unset (no hardcoded publisher). */
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // <meta name="category">: an optional hint some crawlers and directories read; schema.org applicationCategory below says the same.
  category: "Data analytics software",
  classification: "Business software / Data analysis",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Let search and answer engines quote as much as they need and show large previews.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  ...(ADSENSE_CLIENT
    ? {
        other: {
          "google-adsense-account": ADSENSE_CLIENT,
        },
      }
    : {}),
  keywords: [
    "AnalyzeIt",
    "analyzeit.si",
    "analytics workspace",
    "data chat",
    "ask your data",
    "live data tools",
    "find insights in data",
    "public datasets",
    "online data analysis tools",
    "data analysis software",
    "AI data analytics",
    "AI data analysis tool",
    "business analytics tools",
    "data visualization tools",
    "statistical analysis tools",
    "types of data analysis",
    "data analytics platform",
    "analyze data online",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/apple-touch-icon.png`,
      sameAs: [SITE_URL],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Data analytics",
      operatingSystem: "Web, macOS, Windows, Linux",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      featureList: [
        "Ask questions about your data in plain English",
        "Every figure computed in code, with the source and query shown",
        "Find what changed and why: drivers, segments, outliers",
        "Forecasts with a tested range",
        "Connect Stripe, GitHub, Salesforce, Postgres and SQLite",
        "Desktop app and command-line tool",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        url: `${SITE_URL}/products`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${playfair.variable} ${spaceMono.variable} h-full antialiased selection:bg-[var(--brand)]/30 selection:text-[#414141] dark:selection:bg-[var(--brand)]/30 dark:selection:text-[#EDEDED]`}
    >
      <head>
        {/* AdSense ownership is proven by the google-adsense-account meta tag (see metadata) and /ads.txt. The ad script itself is loaded by
            AdSlot only when an ad is about to be shown, so signed-in paid users never download it and the page has no third-party script to hydrate. */}
        <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <script
          dangerouslySetInnerHTML={{
            __html: buildSessionBootScript(),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            // Drop any previously registered /sw.js (third-party SW) so it stops controlling the origin.
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})}).catch(function(){})}`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)] font-sans antialiased overflow-x-hidden transition-colors duration-300"
      >
        {/* In <body>, not <head>: the AdSense library injects its own script into <head> before hydration, which
            shifted React's positional match and raised a hydration mismatch on every page. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <UIProvider>
            <GlobeProvider>
              <SmoothScrollProvider>
                <SkipToContent />
                {children}
              </SmoothScrollProvider>
            </GlobeProvider>
          </UIProvider>
        </ThemeProvider>
        <Analytics />
        {/* A 10% sample is plenty for Core Web Vitals trends; each data point is billed. */}
        <SpeedInsights sampleRate={0.1} />
      </body>
    </html>
  );
}
