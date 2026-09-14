import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const scriptCsp = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptCsp,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' blob: data: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: http:",
      "frame-src 'self' https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

if (isProd) {
  securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Same-origin asset endpoint (/api/assets?key=...). Omitting `search`
    // allows the ?key= query string used by the local storage provider.
    localPatterns: [{ pathname: '/api/assets' }],
    // External S3-compatible hosts configured via env.
    remotePatterns: (() => {
      const hosts = new Set<string>()
      for (const raw of [process.env.S3_PUBLIC_URL, process.env.S3_ENDPOINT]) {
        if (!raw) continue
        try {
          hosts.add(new URL(raw).hostname)
        } catch {
          // ignore malformed values
        }
      }
      return [...hosts].map((hostname) => ({ protocol: 'https' as const, hostname }))
    })(),
    dangerouslyAllowSVG: false,
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [320, 420, 640, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 224, 256, 400],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;