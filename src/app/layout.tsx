import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ViewTransition } from "react";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import Header from "@/components/Header";
import GrainOverlay from "@/components/GrainOverlay";
import { spaceGrotesk, bricolageGrotesque } from "@/lib/fonts";
import DoodleLayer from '@/components/doodle-layer/DoodleLayer';


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Product Designer`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Product designer working across product design, design systems, and code.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html
    lang="en"
    className={`h-full antialiased ${spaceGrotesk.variable} ${bricolageGrotesque.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <GrainOverlay />
        <DoodleLayer />
        <Header />
        <ViewTransition>
          {children}
          {modal}
        </ViewTransition>
        <Analytics />
      </body>
    </html>
  );
}
