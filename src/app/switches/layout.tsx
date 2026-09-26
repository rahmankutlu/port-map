import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Switch Inventory",
  description:
    "Document managed switches, rack placement, hardware details, and port capacity.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
