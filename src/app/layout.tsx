import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContentMill — Automated Content Sites That Build Your SEO Authority",
  description: "Add your content sources, let our AI rewrite and optimise them, then publish automatically to beautiful sites with built-in newsletters, social posting, and custom domains.",
  keywords: ["content syndication", "content marketing", "automation", "AI", "SEO", "newsletter"],
  authors: [{ name: "ContentMill" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "ContentMill — Automated Content Sites",
    description: "Automated content sites that build your SEO authority.",
    siteName: "ContentMill",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
