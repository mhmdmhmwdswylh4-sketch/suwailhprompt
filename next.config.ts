import type { NextConfig } from "next";

// Strict CSP: the browser may only talk to OUR origin (+ Firebase Auth). A user's API key therefore cannot be
// exfiltrated to a third-party host even if some script were injected; it can only go to /api/engineer.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Next.js needs inline bootstrap scripts; Firebase popup auth loads Google's apis script.
  `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'"} https://apis.google.com`.replace(/\s+/g, " "),
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
