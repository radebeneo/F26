import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "F26 Fantasy | FIFA World Cup 2026",
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
      <body className={`${inter.variable} antialiased min-h-screen bg-navy-gradient`}>
        {children}
      </body>
    </html>
  );
}
