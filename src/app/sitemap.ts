import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const siteUrl = "https://rahmankutlu.github.io/port-map";
const routes = [
  "",
  "/switches",
  "/port-map",
  "/vlans",
  "/devices",
  "/import-export",
  "/settings",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route, index) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date("2026-09-26"),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/port-map" ? 0.9 : 0.7,
  }));
}
