import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VLAN Management",
  description:
    "Maintain a validated VLAN catalog and review usage across documented switches.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
