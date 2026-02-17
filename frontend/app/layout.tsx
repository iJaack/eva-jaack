import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const title = "Eva Protocol — AI-Powered Truth Verification";
const description =
  "A trust-weighted social news network. Curate truth, earn yield. Follow by backing curators, consume trust-ranked feeds, and tip directly in $EVA.";

export const metadata: Metadata = {
  metadataBase: new URL("https://eva.jaack.me"),
  title,
  description,
  applicationName: "Eva Protocol",
  icons: {
    icon: "/favicon.svg"
  },
  openGraph: {
    type: "website",
    url: "https://eva.jaack.me",
    title,
    description,
    siteName: "Eva Protocol",
    images: [
      {
        url: "/social-card.svg",
        width: 1200,
        height: 630,
        alt: "Eva Protocol social card"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/social-card.svg"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="site-backdrop" aria-hidden>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
          <div className="blob blob-5" />
          <div className="backdrop-grid" />
        </div>
        {children}
      </body>
    </html>
  );
}
