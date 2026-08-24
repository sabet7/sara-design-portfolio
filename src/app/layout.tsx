import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import Dimmer from "@/components/Dimmer";
import Header from "@/components/Header";
import SaElie from "@/components/SaElie";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 50 }}>
          <Dimmer />
        </div>
        <Header />
        <SaElie />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
