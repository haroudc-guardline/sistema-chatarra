import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production config for Vercel
  images: {
    unoptimized: true,
  },
  // Bundle the logo PNG with the send-email serverless function on Vercel.
  // Files under public/ are NOT included in serverless traces by default.
  outputFileTracingIncludes: {
    "/api/sales/[id]/send-email": ["./public/images/logo_SIAE.png"],
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
};

export default nextConfig;
