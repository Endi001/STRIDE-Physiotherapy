import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteNav } from "@/components/stride/SiteNav";
import { Footer } from "@/components/stride/Footer";
import { useLenis } from "@/hooks/use-lenis";
import { BookingProvider } from "@/components/stride/booking-context";
import { BookingModal } from "@/components/stride/BookingModal";

function NotFoundComponent() {
  return (
    <div className="stride-section-dark min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="eyebrow text-[color:var(--muted-on-dark)]">404</div>
        <h1 className="mt-4 font-display text-[clamp(3rem,10vw,7rem)] leading-[0.9]">
          Off route.
        </h1>
        <p className="mt-4 text-sm text-[color:var(--muted-on-dark)]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center bg-[color:var(--ember)] px-5 py-3 text-sm font-medium text-[color:var(--ember-foreground)]"
            style={{ borderRadius: 3 }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="stride-section-light min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="eyebrow text-[color:var(--muted-on-light)]">Something broke</div>
        <h1 className="mt-4 font-display text-[clamp(2rem,6vw,4rem)] leading-[0.9]">
          This page didn't load.
        </h1>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-[color:var(--ember)] px-5 py-3 text-sm font-medium text-[color:var(--ember-foreground)]"
            style={{ borderRadius: 3 }}
          >
            Try again
          </button>
          <a
            href="/"
            className="px-5 py-3 border border-[color:var(--hairline-light)] text-sm"
            style={{ borderRadius: 3 }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const jsonLdClinic = {
  "@context": "https://schema.org",
  "@type": ["MedicalClinic", "Physiotherapy"],
  "name": "STRIDE Physiotherapy",
  "image": "https://stridephysio.ie/og-image.png",
  "url": "https://stridephysio.ie",
  "telephone": "+353 1 555 0192",
  "email": "hello@stridephysio.ie",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "14 Ashfield Quay",
    "addressLocality": "Dublin",
    "addressCountry": "IE"
  },
  "description": "STRIDE is a physiotherapy clinic in Ashfield Quay treating pain, injury and mobility problems. Assess, treat, rebuild, return.",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "07:00",
      "closes": "20:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "08:00",
      "closes": "16:00"
    }
  ],
  "medicalSpecialty": "Physiotherapy",
  "priceRange": "$$"
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "STRIDE Physiotherapy — Momentum is built, not born." },
      {
        name: "description",
        content:
          "STRIDE is a physiotherapy clinic in Ashfield Quay treating pain, injury and mobility problems. We rebuild movement — assess, treat, rebuild, return.",
      },
      { name: "author", content: "STRIDE Physiotherapy" },
      {
        name: "keywords",
        content:
          "physiotherapy, physio, Ashfield Quay, Dublin physio, sports injury, back pain, rehabilitation, physical therapy, joint pain",
      },
      { name: "theme-color", content: "#0c0c0d" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "STRIDE" },

      // Open Graph Metadata
      { property: "og:site_name", content: "STRIDE Physiotherapy" },
      { property: "og:title", content: "STRIDE Physiotherapy — Momentum is built, not born." },
      {
        property: "og:description",
        content:
          "Physiotherapy in Ashfield Quay. We treat pain, rebuild movement, and get you back to full speed.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stridephysio.ie" },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:image:secure_url", content: "/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content:
          "STRIDE Physiotherapy Clinic website snapshot preview showing high-performance physical therapy in Ashfield Quay.",
      },
      { property: "og:locale", content: "en_IE" },

      // Twitter / X Metadata
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "STRIDE Physiotherapy — Momentum is built, not born." },
      {
        name: "twitter:description",
        content:
          "Physiotherapy in Ashfield Quay. We treat pain, rebuild movement, and get you back to full speed.",
      },
      { name: "twitter:image", content: "/og-image.png" },
      {
        name: "twitter:image:alt",
        content: "STRIDE Physiotherapy website snapshot preview",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/stride.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "canonical", href: "https://stridephysio.ie" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "preconnect", href: "https://api.fontshare.com" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@300;500;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      {
        rel: "preload",
        as: "style",
        href: "https://api.fontshare.com/v2/css?f[]=general-sans@400,500&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@300;500;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f[]=general-sans@400,500&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLdClinic),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <BookingProvider>
        <AppShell />
      </BookingProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const routerState = useRouterState();
  const isAdmin = routerState.location.pathname.startsWith("/admin");

  useLenis();

  if (isAdmin) {
    return (
      <main id="main">
        <Outlet />
      </main>
    );
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:bg-[color:var(--ember)] focus:text-[color:var(--ember-foreground)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <BookingModal />
    </>
  );
}
