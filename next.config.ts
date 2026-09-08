import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error — viewTransition is a real, working experimental
    // Next.js flag; your installed next package's TypeScript types just
    // haven't caught up to include it yet. This only silences the type
    // checker, it doesn't change runtime behavior.
    viewTransition: true,
  },
};

export default nextConfig;
