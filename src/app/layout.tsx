import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const fwcSans = localFont({
  src: [
    {
      path: "../../public/fonts/FWC2026-NormalRegular.77c3c249.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/FWC2026-NormalBlack.2bd896c8.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const fwcDisplay = localFont({
  src: "../../public/fonts/FWC2026-ExpandedBlack.e49451e9.ttf",
  variable: "--font-display",
  weight: "900",
  display: "swap",
});

const fwcSemiExpanded = localFont({
  src: "../../public/fonts/FWC2026-SemiExpandedBlack.e378fa1c.ttf",
  variable: "--font-semi-expanded",
  weight: "900",
  display: "swap",
});

const fwcCondensed = localFont({
  src: "../../public/fonts/FWC2026-CondensedLight.c11e508e.ttf",
  variable: "--font-condensed",
  weight: "300",
  display: "swap",
});

const fwcUltraCondensed = localFont({
  src: [
    {
      path: "../../public/fonts/FWC2026-UltraCondensedMedium.4da29b9d.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/FWC2026-UltraCondensedBold.0e7149b5.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/FWC2026-UltraCondensedBlack.8e6ba053.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-ultra-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FWC26 Fantasy | FIFA World Cup 2026",
    template: "%s | F26 Fantasy",
  },
  description:
    "Pick your 15-player squad, earn points from every World Cup 2026 match, and compete on the global leaderboard. Free to play.",
  keywords: [
    "FIFA World Cup 2026",
    "fantasy football",
    "fantasy soccer",
    "World Cup fantasy",
    "F26 Fantasy",
  ],
  authors: [{ name: "F26 Fantasy" }],
  creator: "F26 Fantasy",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "F26 Fantasy",
    title: "F26 Fantasy | FIFA World Cup 2026",
    description:
      "Pick your 15-player squad, earn points from every World Cup 2026 match, and compete on the global leaderboard.",
  },
  twitter: {
    card: "summary_large_image",
    title: "F26 Fantasy | FIFA World Cup 2026",
    description: "The official fantasy game for FIFA World Cup 2026.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a1128" },
    { media: "(prefers-color-scheme: light)", color: "#f0f4ff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `dark` class enables dark-first design via Tailwind darkMode: 'class'
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${fwcSans.variable} ${fwcDisplay.variable} ${fwcSemiExpanded.variable} ${fwcCondensed.variable} ${fwcUltraCondensed.variable} antialiased min-h-screen bg-navy-gradient font-sans`}>
        {children}
      </body>
    </html>
  );
}
