import { Space_Grotesk, Bricolage_Grotesque } from "next/font/google";
// import localFont from "next/font/local";

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

import localFont from "next/font/local";

export const clashGrotesk = localFont({
  src: [
    { path: "../fonts/ClashGrotesk-Extralight.woff2", weight: "200", style: "normal" },
    { path: "../fonts/ClashGrotesk-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/ClashGrotesk-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ClashGrotesk-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ClashGrotesk-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ClashGrotesk-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-clash-grotesk",
});

// Once you have the Clash Grotesk Variable .woff2 file:
// 1. Save it to public/fonts/ClashGrotesk-Variable.woff2
// 2. Uncomment the localFont import above and this block:
//
// export const clashGrotesk = localFont({
//   src: "../../public/fonts/ClashGrotesk-Variable.woff2",
//   variable: "--font-clash",
//   display: "swap",
// });
//
// 3. Add clashGrotesk.variable to the className list in layout.tsx
// 4. Change the line in globals.css (search "ACTIVE FONT") to use it
