import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import Header from "@/components/Header";
import { spaceGrotesk, bricolageGrotesque } from "@/lib/fonts";

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
        <Header />
        {children}
        {modal}
        <Analytics />
      </body>
    </html>
  );
}
