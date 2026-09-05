import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/**
 * Serwist injects the precache list during a **webpack** production build.
 * `next build --turbopack` skips that plugin, so Cache Storage stays empty.
 */
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout.trim() ||
  crypto.randomUUID();

const OPTIONAL_PAGES: [string, string][] = [
  ["/daily", "src/app/daily/page.tsx"],
  ["/growth", "src/app/growth/page.tsx"],
  ["/reflect", "src/app/reflect/page.tsx"],
];

const APP_SHELL_ROUTES = [
  "/",
  "/map",
  "/notes",
  "/skills",
  "/insights",
  "/timeline",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  ...OPTIONAL_PAGES.filter(([, file]) => existsSync(file)).map(([url]) => url),
];

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: false,
  cacheOnNavigation: true,
  additionalPrecacheEntries: APP_SHELL_ROUTES.map((url) => ({
    url,
    revision,
  })),
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
