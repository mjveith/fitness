import withPWAInit from "next-pwa";
import runtimeCaching from "next-pwa/cache.js";

const isDev = process.env.NODE_ENV === "development";

const withPWA = withPWAInit({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    ...runtimeCaching,
    {
      urlPattern: /\/api\/exercises$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "exercise-library",
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60 * 24 * 14,
        },
      },
    },
    {
      urlPattern: /\/api\/plan\/current$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "current-plan",
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
    {
      urlPattern: /\/(schedule|log|exercises|progress)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "app-shell",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
  ],
});

/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
};

export default withPWA(nextConfig);
