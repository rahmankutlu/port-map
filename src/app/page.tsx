"use client";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Cable,
  CircleCheck,
  EthernetPort,
  Layers3,
  Power,
  Server,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import { Badge } from "@/components/ui";
import { useWorkspace } from "@/features/workspace/workspace-provider";

export default function Dashboard() {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  const active = workspace.ports.filter(
    (port) => port.status === "Connected",
  ).length;
  const stats = [
    ["Switches", workspace.switches.length, Server, "Managed inventory"],
    [
      "Total ports",
      workspace.ports.length,
      EthernetPort,
      "Across all switches",
    ],
    [
      "Active",
      active,
      CircleCheck,
      `${Math.round((active / Math.max(1, workspace.ports.length)) * 100)}% utilization`,
    ],
    [
      "Available",
      workspace.ports.filter((port) => port.status === "Disconnected").length,
      Cable,
      "Ready to assign",
    ],
    [
      "PoE active",
      workspace.ports.filter((port) => port.poeEnabled).length,
      Power,
      "Powered endpoints",
    ],
    [
      "Trunks",
      workspace.ports.filter((port) => ["Trunk", "Uplink"].includes(port.type))
        .length,
      ArrowUpRight,
      "Trunk and uplink",
    ],
    ["VLANs", workspace.vlans.length, Layers3, "Configured networks"],
  ] as const;
  const recent = [...workspace.ports]
    .sort((a, b) => b.lastModified.localeCompare(a.lastModified))
    .slice(0, 6);
  const warnings = workspace.ports.filter(
    (port) => port.status === "Warning" || (port.poeEnabled && !port.poePower),
  );
  return (
    <div className="page">
      <PageHeader
        eyebrow="Overview"
        title="Network workspace"
        description="Operational status across your documented switch estate."
        actions={
          <Link
            className="button button-primary"
            href="/port-map"
            prefetch={false}
          >
            <Cable size={16} />
            Open port map
          </Link>
        }
      />
      <div className="stat-grid">
        {stats.map(([label, value, Icon, detail]) => (
          <div className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <Icon size={17} />
            </div>
            <strong>{value}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel title="Switch overview" description="Port use by device">
          <div className="switch-overview">
            {workspace.switches.map((sw) => {
              const ports = workspace.ports.filter(
                (port) => port.switchId === sw.id,
              );
              const used = ports.filter(
                (port) => port.status === "Connected",
              ).length;
              return (
                <Link
                  href={`/port-map?switch=${sw.id}`}
                  key={sw.id}
                  className="switch-row"
                  prefetch={false}
                >
                  <div className="switch-icon">
                    <Server size={18} />
                  </div>
                  <div className="switch-row-main">
                    <div>
                      <strong>{sw.name}</strong>
                      <span>
                        {sw.vendor} · {sw.model}
                      </span>
                    </div>
                    <div className="util">
                      <span>
                        {used}/{ports.length}
                      </span>
                      <div>
                        <i
                          style={{
                            width: `${(used / Math.max(1, ports.length)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              );
            })}
          </div>
        </Panel>
        <Panel
          title="Requires attention"
          description="Ports that may need review"
          action={
            <Badge tone={warnings.length ? "amber" : "green"}>
              {warnings.length} open
            </Badge>
          }
        >
          <div className="attention-list">
            {warnings.length ? (
              warnings.slice(0, 5).map((port) => {
                const sw = workspace.switches.find(
                  (item) => item.id === port.switchId,
                );
                return (
                  <Link
                    href={`/port-map?switch=${port.switchId}&port=${port.id}`}
                    key={port.id}
                    prefetch={false}
                  >
                    <span className="attention-icon">
                      <AlertTriangle size={16} />
                    </span>
                    <span>
                      <strong>
                        {sw?.name} · Port {port.number}
                      </strong>
                      <small>
                        {port.description || "PoE configuration needs review"}
                      </small>
                    </span>
                    <Badge tone="amber">Warning</Badge>
                  </Link>
                );
              })
            ) : (
              <div className="inline-empty">
                <CircleCheck size={20} />
                <span>All documented ports look healthy.</span>
              </div>
            )}
          </div>
        </Panel>
      </div>
      <Panel
        title="Recently edited ports"
        description="Latest configuration activity"
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Port</th>
                <th>Switch</th>
                <th>Device</th>
                <th>VLAN</th>
                <th>Status</th>
                <th>Modified</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((port) => (
                <tr key={port.id}>
                  <td>
                    <Link
                      href={`/port-map?switch=${port.switchId}&port=${port.id}`}
                      className="table-link"
                      prefetch={false}
                    >
                      Port {port.number}
                    </Link>
                  </td>
                  <td>
                    {
                      workspace.switches.find(
                        (item) => item.id === port.switchId,
                      )?.name
                    }
                  </td>
                  <td>{port.connectedDevice || "—"}</td>
                  <td>
                    {port.vlanId
                      ? `${port.vlanId} · ${workspace.vlans.find((vlan) => vlan.id === port.vlanId)?.name}`
                      : "—"}
                  </td>
                  <td>
                    <Badge
                      tone={
                        port.status === "Connected"
                          ? "green"
                          : port.status === "Warning"
                            ? "amber"
                            : "neutral"
                      }
                    >
                      {port.status}
                    </Badge>
                  </td>
                  <td>
                    {new Intl.DateTimeFormat("en", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(port.lastModified))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
