import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { protocol } from "@/lib/protocol";

const title = `${protocol.app.name} — Trust-weighted social news on Avalanche`;
const description =
  "Eva Protocol is a trust-weighted social news network on Avalanche where curators stake $EVA, Eva verifies claims, and reputation drives distribution.";

export const metadata: Metadata = {
  metadataBase: new URL(protocol.app.siteUrl),
  title,
  description,
  applicationName: protocol.app.name,
  icons: {
    icon: "/favicon.svg"
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)})();` }} />
      </head>
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
