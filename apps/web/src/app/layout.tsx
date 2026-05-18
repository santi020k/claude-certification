import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Claude Certification Playground",
    template: "%s · Claude Certification",
  },
  description:
    "A production-shaped FastAPI + Next.js playground for exploring the Anthropic Claude API. Tune prompts, inspect token usage, and verify your backend — all from one focused interface.",
  keywords: [
    "Anthropic",
    "Claude AI",
    "FastAPI",
    "Next.js",
    "AI playground",
    "Claude API",
    "LLM",
    "chatbot",
    "certification",
  ],
  authors: [{ name: "santi020k", url: "https://github.com/santi020k" }],
  creator: "santi020k",

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Claude Certification Playground",
    title: "Claude Certification Playground",
    description:
      "Ask Claude anything from a production-shaped FastAPI + Next.js playground. Tune prompts, inspect token usage, and verify your backend.",
  },

  // ── Twitter / X card ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Claude Certification Playground",
    description:
      "Ask Claude anything from a production-shaped FastAPI + Next.js playground.",
    creator: "@santi020k",
  },

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/brand/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#191714",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
