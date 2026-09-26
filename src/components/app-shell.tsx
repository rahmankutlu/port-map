"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  Cable,
  Database,
  Download,
  LayoutDashboard,
  Menu,
  Moon,
  Network,
  PanelLeftClose,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  WorkspaceProvider,
  useWorkspace,
} from "@/features/workspace/workspace-provider";
import { ToastProvider } from "./toast";

const nav = [
  {
    href: "/",
    label: "Overview",
    detail: "Workspace index",
    code: "01",
    icon: LayoutDashboard,
  },
  {
    href: "/switches",
    label: "Switches",
    detail: "Hardware register",
    code: "02",
    icon: Boxes,
  },
  {
    href: "/port-map",
    label: "Port map",
    detail: "Physical ports",
    code: "03",
    icon: Cable,
  },
  {
    href: "/vlans",
    label: "VLANs",
    detail: "Segmentation",
    code: "04",
    icon: Network,
  },
  {
    href: "/devices",
    label: "Devices",
    detail: "Derived endpoints",
    code: "05",
    icon: Activity,
  },
  {
    href: "/import-export",
    label: "Data",
    detail: "Import & backup",
    code: "06",
    icon: Download,
  },
  {
    href: "/settings",
    label: "Settings",
    detail: "Local preferences",
    code: "07",
    icon: Settings,
  },
];

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { workspace, ready } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const theme = workspace?.settings.theme ?? "system";
  const activeRoute = nav.find((item) => item.href === pathname) ?? nav[0];
  useEffect(() => {
    const dark =
      theme === "dark" ||
      (theme === "system" &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [theme]);
  if (!ready)
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          <Cable size={20} />
        </div>
        <span>Loading workspace…</span>
      </div>
    );
  return (
    <div
      className={`app-shell ${collapsed ? "sidebar-collapsed" : ""} ${workspace?.settings.compactMode ? "compact" : ""}`}
    >
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">P/M</span>
          <span className="brand-copy">
            <strong>PORT MAP</strong>
            <small>Physical network records</small>
          </span>
          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>
        <nav aria-label="Main navigation">
          <span className="nav-label">Workspace index</span>
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-code">{item.code}</span>
                <Icon size={17} />
                <span className="nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="storage-indicator">
            <Database size={15} />
            <span>
              <strong>Browser storage</strong>
              <small>Local only · IndexedDB</small>
            </span>
          </div>
          <button
            className="collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Toggle sidebar"
          >
            <PanelLeftClose size={17} />
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="app-main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Module {activeRoute.code}</span>
            <strong>{activeRoute.label}</strong>
          </div>
          <div className="topbar-meta">
            <span className="local-chip">Local only</span>
            <span className="saved">
              <span className="status-dot" />
              Browser data ready
            </span>
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <WorkspaceProvider>
        <Shell>{children}</Shell>
      </WorkspaceProvider>
    </ToastProvider>
  );
}
