import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import AnimatedBackdrop from "@/components/motion/AnimatedBackdrop";
import { MotionProvider } from "@/components/motion/MotionProvider";
import EvaProviders from "@/components/EvaProviders";
import { fontVariables, manrope, spaceGrotesk } from "@/lib/fonts";
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
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)})();`,
          }}
        />
      </head>
      <body className={`${spaceGrotesk.className} ${manrope.className}`}>
        <MotionProvider>
          <AnimatedBackdrop />
          <EvaProviders>{children}</EvaProviders>
        </MotionProvider>
      </body>
    </html>
  );
}
