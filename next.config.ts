import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/chatbot-host.html",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src https://www.noupe.com https://noupe.com; connect-src https:; img-src https: data:; style-src 'unsafe-inline' https:; font-src https: data:; frame-src https://www.noupe.com https://noupe.com; worker-src https: blob:; frame-ancestors 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
