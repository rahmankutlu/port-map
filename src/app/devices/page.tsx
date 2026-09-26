"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import { Badge, EmptyState, Input, Select } from "@/components/ui";
import { deviceTypes } from "@/domain/models";
import { useWorkspace } from "@/features/workspace/workspace-provider";

export default function DevicesPage() {
  const { workspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [switchId, setSwitchId] = useState("");
  const [vlan, setVlan] = useState("");
  const devices = useMemo(
    () =>
      (workspace?.devices ?? []).filter((device) => {
        const text = [
          device.name,
          device.hostname,
          device.ipAddress,
          device.macAddress,
          device.location,
          device.notes,
        ]
          .join(" ")
          .toLowerCase();
        return (
          (!query || text.includes(query.toLowerCase())) &&
          (!type || device.type === type) &&
          (!switchId || device.switchId === switchId) &&
          (!vlan || device.vlanId === Number(vlan))
        );
      }),
    [workspace, query, type, switchId, vlan],
  );
  if (!workspace) return null;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Connected endpoints"
        title="Devices"
        description="An automatically maintained inventory derived from port assignments."
      />
      <Panel className="filter-panel">
        <div className="filter-row">
          <div className="search-box">
            <Search size={16} />
            <Input
              aria-label="Search devices"
              placeholder="Search name, IP, MAC, location…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select
            aria-label="Filter device type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All device types</option>
            {deviceTypes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
          <Select
            aria-label="Filter switch"
            value={switchId}
            onChange={(e) => setSwitchId(e.target.value)}
          >
            <option value="">All switches</option>
            {workspace.switches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter VLAN"
            value={vlan}
            onChange={(e) => setVlan(e.target.value)}
          >
            <option value="">All VLANs</option>
            {workspace.vlans.map((item) => (
              <option value={item.id} key={item.id}>
                {item.id} · {item.name}
              </option>
            ))}
          </Select>
        </div>
      </Panel>
      <Panel
        title="Device inventory"
        description={`${devices.length} documented endpoints`}
      >
        {devices.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Type</th>
                  <th>IP address</th>
                  <th>MAC address</th>
                  <th>Switch / port</th>
                  <th>VLAN</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => {
                  const sw = workspace.switches.find(
                    (item) => item.id === device.switchId,
                  );
                  const port = workspace.ports.find(
                    (item) => item.id === device.portId,
                  );
                  return (
                    <tr key={device.id}>
                      <td>
                        <strong className="cell-primary">{device.name}</strong>
                        <small>{device.hostname}</small>
                      </td>
                      <td>
                        <Badge tone="blue">{device.type}</Badge>
                      </td>
                      <td className="mono">{device.ipAddress || "—"}</td>
                      <td className="mono">{device.macAddress || "—"}</td>
                      <td>
                        <Link
                          className="table-link"
                          href={`/port-map?switch=${device.switchId}&port=${device.portId}`}
                        >
                          {sw?.name} / {port?.number}
                        </Link>
                      </td>
                      <td>{device.vlanId ?? "—"}</td>
                      <td>{device.location || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Activity />}
            title="No devices match"
            description="Devices appear here when a connected device is assigned to a port."
          />
        )}
      </Panel>
    </div>
  );
}
