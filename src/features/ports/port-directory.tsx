"use client";

import { Power } from "lucide-react";
import { Panel } from "@/components/page";
import { Badge } from "@/components/ui";
import type { Port, Vlan } from "@/domain/models";

export function PortDirectory({
  ports,
  totalPorts,
  vlans,
  selectedPortIds,
  onTogglePort,
  onEditPort,
}: {
  ports: Port[];
  totalPorts: number;
  vlans: Vlan[];
  selectedPortIds: ReadonlySet<string>;
  onTogglePort: (id: string) => void;
  onEditPort: (port: Port) => void;
}) {
  return (
    <Panel
      title="Port directory"
      description={`${ports.length} of ${totalPorts} physical ports`}
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="check-col"></th>
              <th>Port</th>
              <th>Status</th>
              <th>Type</th>
              <th>Device</th>
              <th>VLAN</th>
              <th>Address</th>
              <th>Link</th>
              <th>PoE</th>
            </tr>
          </thead>
          <tbody>
            {ports.map((port) => (
              <tr key={port.id} onDoubleClick={() => onEditPort(port)}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select port ${port.number}`}
                    checked={selectedPortIds.has(port.id)}
                    onChange={() => onTogglePort(port.id)}
                  />
                </td>
                <td>
                  <button
                    className="table-link"
                    onClick={() => onEditPort(port)}
                  >
                    {port.number} {port.name && <small>{port.name}</small>}
                  </button>
                </td>
                <td>
                  <Badge
                    tone={
                      port.status === "Connected"
                        ? "green"
                        : port.status === "Warning"
                          ? "amber"
                          : port.status === "Disabled"
                            ? "red"
                            : "neutral"
                    }
                  >
                    {port.status}
                  </Badge>
                </td>
                <td>
                  <Badge
                    tone={
                      ["Trunk", "Uplink"].includes(port.type)
                        ? "purple"
                        : "blue"
                    }
                  >
                    {port.type}
                  </Badge>
                </td>
                <td>
                  <strong className="cell-primary">
                    {port.connectedDevice || "—"}
                  </strong>
                  <small>
                    {port.deviceType !== "Other" ? port.deviceType : ""}
                  </small>
                </td>
                <td>
                  {port.vlanId ? (
                    <span className="vlan-cell">
                      <i
                        style={{
                          background: vlans.find(
                            (item) => item.id === port.vlanId,
                          )?.color,
                        }}
                      />
                      {port.vlanId}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <span className="mono">
                    {port.ipAddress || port.macAddress || "—"}
                  </span>
                </td>
                <td>
                  {port.status === "Connected"
                    ? `${port.speed} · ${port.duplex}`
                    : "—"}
                </td>
                <td>
                  {port.poeEnabled ? (
                    <span className="poe-cell">
                      <Power size={13} />
                      {port.poePower ?? 0} W
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
