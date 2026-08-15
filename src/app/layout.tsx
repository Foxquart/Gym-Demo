import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const accent = Instrument_Serif({
  variable: "--font-accent",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://emberathletic.club"),
  title: {
    default: "Ember Athletic Club — Strength, forged warm",
    template: "%s · Ember Athletic Club",
  },
  description:
    "A strength and conditioning club built around coaching, not machines. Small-group classes, elite trainers, and a membership that adapts to you.",
  keywords: ["gym", "strength training", "personal trainer", "fitness club", "membership"],
  openGraph: {
    title: "Ember Athletic Club — Make the best version of you",
    description:
      "Coaching-led strength & conditioning in Bandra West and Indiranagar. Small groups capped at 8–24, four full-time coaches, memberships from ₹1,990 a month.",
    url: "/",
    siteName: "Ember Athletic Club",
    locale: "en_IN",
    type: "website",
    images: [
      {
        // Regenerate from /og-image — see src/app/og-image/page.tsx
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ember Athletic Club — make the best version of you, with us. Eat, sleep, lift, repeat.",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ember Athletic Club — Make the best version of you",
    description:
      "Coaching-led strength & conditioning. Small groups, four full-time coaches, memberships from ₹1,990 a month.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ember Athletic Club — make the best version of you, with us.",
      },
    ],
  },
  appleWebApp: {
    title: "Ember Athletic Club",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  other: {
    "msapplication-TileColor": "#e4572e",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#14100d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} ${accent.variable} bg-bg text-ink antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "var(--surface)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
