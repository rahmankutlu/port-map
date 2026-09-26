"use client";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Cable, CircleCheck } from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import { Badge } from "@/components/ui";
import { useWorkspace } from "@/features/workspace/workspace-provider";

export default function Dashboard() {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  const active = workspace.ports.filter(
    (port) => port.status === "Connected",
  ).length;
  const available = workspace.ports.filter(
    (port) => port.status === "Disconnected",
  ).length;
  const poe = workspace.ports.filter((port) => port.poeEnabled).length;
  const trunks = workspace.ports.filter((port) =>
    ["Trunk", "Uplink"].includes(port.type),
  ).length;
  const totals = [
    ["Switches", workspace.switches.length, "Documented hardware"],
    ["Ports", workspace.ports.length, "Physical interfaces"],
    ["VLANs", workspace.vlans.length, "Network segments"],
    ["Endpoints", workspace.devices.length, "Derived from ports"],
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
        eyebrow="01 / Local inventory"
        title="Workspace index"
        description="A concise record of the switches, ports, and assignments stored in this browser."
        actions={
          <Link
            className="button button-primary"
            href="/port-map"
            prefetch={false}
          >
            <Cable size={16} />
            Inspect ports
          </Link>
        }
      />
      <section className="ledger-strip" aria-label="Workspace totals">
        {totals.map(([label, value, detail], index) => (
          <div className="ledger-cell" key={label}>
            <span>
              {String(index + 1).padStart(2, "0")} / {label}
            </span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </div>
        ))}
        <div className="ledger-status">
          <span>DOCUMENTATION LOAD</span>
          <strong>
            {Math.round((active / Math.max(1, workspace.ports.length)) * 100)}%
          </strong>
          <div>
            <i
              style={{
                width: `${(active / Math.max(1, workspace.ports.length)) * 100}%`,
              }}
            />
          </div>
          <small>{active} ports marked connected</small>
        </div>
      </section>
      <div className="dashboard-grid dashboard-primary">
        <Panel
          title="Switch register"
          description="Documented capacity by chassis"
          action={
            <span className="panel-count">
              {workspace.switches.length} units
            </span>
          }
        >
          <div className="switch-overview">
            {workspace.switches.map((sw, index) => {
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
                  <span className="switch-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
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
          title="Review queue"
          description="Documentation that needs a second look"
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
                    <span className="queue-code">REVIEW</span>
                  </Link>
                );
              })
            ) : (
              <div className="inline-empty">
                <CircleCheck size={20} />
                <span>No documented ports require attention.</span>
              </div>
            )}
          </div>
        </Panel>
      </div>
      <section className="signal-strip" aria-label="Port documentation summary">
        <div>
          <span>Connected</span>
          <strong>{active}</strong>
        </div>
        <div>
          <span>Available</span>
          <strong>{available}</strong>
        </div>
        <div>
          <span>PoE noted</span>
          <strong>{poe}</strong>
        </div>
        <div>
          <span>Trunk / uplink</span>
          <strong>{trunks}</strong>
        </div>
        <p>Values reflect documented port state, not live switch telemetry.</p>
      </section>
      <Panel
        title="Change ledger"
        description="Most recently edited port records"
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
