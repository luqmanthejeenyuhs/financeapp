import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import Providers from "@/components/providers";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const title = "Kestrel Capital FX — Precision-managed forex execution";
const description =
  "Kestrel Capital FX is a forex brokerage offering algorithmic execution, transparent reporting, and licensed custody of client funds.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Kestrel Capital FX",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body bg-ink text-paper antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
