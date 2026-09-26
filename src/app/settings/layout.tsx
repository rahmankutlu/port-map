import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Settings",
  description:
    "Configure theme, display preferences, defaults, and local workspace data.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
