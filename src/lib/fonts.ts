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
