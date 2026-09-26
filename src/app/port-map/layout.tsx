import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Physical Port Map",
  description:
    "Visualize and document switch ports, VLANs, links, PoE, and connected endpoints.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
