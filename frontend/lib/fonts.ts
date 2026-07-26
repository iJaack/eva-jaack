import { Geist, Geist_Mono, Newsreader } from "next/font/google";

export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const fontVariables = `${geist.variable} ${geistMono.variable} ${newsreader.variable}`;
