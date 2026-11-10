import type { NextConfig } from "next";

const securityHeaders = [
  // Never allow the site to be embedded in another site's frame (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Don't let browsers guess content types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin to other sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Always use HTTPS
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // The app never needs these device features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
