import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import and Export",
  description:
    "Export, validate, back up, and restore the complete local network workspace.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
