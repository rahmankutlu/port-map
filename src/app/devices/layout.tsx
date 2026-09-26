import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Device Inventory",
  description:
    "Search connected devices derived automatically from switch port assignments.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
