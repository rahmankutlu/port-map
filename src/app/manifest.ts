import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Port Map",
    short_name: "Port Map",
    description: "Visual switch port management for network teams.",
    start_url: "/port-map/",
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#1769e0",
    icons: [{ src: "/port-map/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
