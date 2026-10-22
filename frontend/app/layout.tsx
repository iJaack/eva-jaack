import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { MotionProvider } from "@/components/motion/MotionProvider";
import SoftBackdrop from "@/components/motion/SoftBackdrop";
import EvaProviders from "@/components/EvaProviders";
import { fontVariables } from "@/lib/fonts";
import { protocol } from "@/lib/protocol";

const title = `${protocol.app.name} — Public thesis publishing for prediction markets`;
const description =
  "Eva turns prediction markets, facts, and second-order signals into public thesis posts with anchors and visible revision history.";

export const metadata: Metadata = {
  metadataBase: new URL(protocol.app.siteUrl),
  title,
  description,
  applicationName: protocol.app.name,
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: protocol.app.siteUrl,
    title,
    description,
    siteName: protocol.app.name,
    images: [
      {
        url: "/social-card.svg",
        width: 1200,
        height: 630,
        alt: "Eva Protocol social card",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/social-card.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        {/* Parser-blocking on purpose: next/script beforeInteractive runs after first paint and would flash the wrong theme. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/jaack-theme.js" data-light-from="7" data-light-to="19" data-key="jaack.theme" />
      </head>
      <body>
        <SoftBackdrop />
        <MotionProvider>
          <EvaProviders>{children}</EvaProviders>
        </MotionProvider>
      </body>
    </html>
  );
}
