import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL("https://rahmankutlu.github.io/port-map/"),
  title: { default: "Port Map", template: "%s · Port Map" },
  description: "Local-first visual switch port management for network teams.",
  applicationName: "Port Map",
  authors: [{ name: "Rahman Kutlu", url: "https://github.com/rahmankutlu" }],
  creator: "Rahman Kutlu",
  publisher: "Rahman Kutlu",
  category: "Network management",
  keywords: [
    "switch port management",
    "network documentation",
    "VLAN management",
    "NetOps",
    "network inventory",
    "PoE",
    "local-first",
  ],
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    url: "https://rahmankutlu.github.io/port-map/",
    siteName: "Port Map",
    title: "Port Map — Visual switch port management",
    description:
      "Document switches, physical ports, VLANs, PoE endpoints, and connected devices in a local-first workspace.",
    images: [
      {
        url: "https://rahmankutlu.github.io/port-map/social-preview.png",
        width: 1280,
        height: 640,
        alt: "Port Map visual switch port management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Port Map — Visual switch port management",
    description:
      "Local-first switch port, VLAN, PoE, and device documentation for network teams.",
    images: ["https://rahmankutlu.github.io/port-map/social-preview.png"],
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${mono.variable}`}>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Port Map",
            applicationCategory: "NetworkManagementApplication",
            operatingSystem: "Web",
            url: "https://rahmankutlu.github.io/port-map/",
            codeRepository: "https://github.com/rahmankutlu/port-map",
            license: "https://opensource.org/license/mit",
            description:
              "Local-first visual switch port management for network teams.",
            author: {
              "@type": "Person",
              name: "Rahman Kutlu",
              url: "https://github.com/rahmankutlu",
            },
          })}
        </script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
