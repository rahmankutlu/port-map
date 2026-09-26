"use client";

import { AlertTriangle, Check, Power, X } from "lucide-react";
import type { MouseEvent } from "react";
import type { NetworkSwitch, Port, PortStatus } from "@/domain/models";

const statusIcon = (status: PortStatus) =>
  status === "Warning" ? (
    <AlertTriangle size={10} />
  ) : status === "Disabled" ? (
    <X size={10} />
  ) : status === "Connected" ? (
    <Check size={10} />
  ) : null;

export function SwitchChassis({
  networkSwitch,
  ports,
  shownPortIds,
  selectedPortIds,
  showPortLabels,
  onOpenPort,
  onTogglePort,
}: {
  networkSwitch: NetworkSwitch;
  ports: Port[];
  shownPortIds: ReadonlySet<string>;
  selectedPortIds: ReadonlySet<string>;
  showPortLabels: boolean;
  onOpenPort: (port: Port) => void;
  onTogglePort: (id: string) => void;
}) {
  const handlePortClick = (event: MouseEvent, port: Port) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) onTogglePort(port.id);
    else onOpenPort(port);
  };
  return (
    <div className="switch-chassis-wrap">
      <section className="switch-chassis">
        <header>
          <div>
            <span className="chassis-vendor">{networkSwitch.vendor}</span>
            <h2>{networkSwitch.name}</h2>
            <p>
              {networkSwitch.model} · {networkSwitch.location} ·{" "}
              {networkSwitch.rack} {networkSwitch.rackUnit}
            </p>
          </div>
          <div className="chassis-status">
            <span>
              <i />
              Documented
            </span>
            <strong>
              {shownPortIds.size}
              <small> shown</small>
            </strong>
          </div>
        </header>
        <div className="chassis-body">
          <div className="device-detail">
            <span className="logo-block">PM</span>
            <div className="status-lights">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div
            className="ports-grid"
            style={{
              gridTemplateColumns: `repeat(${Math.min(24, Math.ceil(networkSwitch.portCount / 2))}, minmax(32px, 1fr))`,
            }}
          >
            {ports.map((port) => {
              const hidden = !shownPortIds.has(port.id);
              const isSelected = selectedPortIds.has(port.id);
              return (
                <button
                  key={port.id}
                  className={`physical-port status-${port.status.toLowerCase()} type-${port.type.toLowerCase()} ${hidden ? "port-dimmed" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={(event) => handlePortClick(event, port)}
                  title={`Port ${port.number}: ${port.connectedDevice || port.status}`}
                  aria-label={`Port ${port.number}, ${port.status}, ${port.connectedDevice || "no device"}`}
                >
                  {showPortLabels && (
                    <span className="port-number">{port.number}</span>
                  )}
                  <span className="port-jack">
                    <i />
                    <i />
                    <i />
                    <i />
                    <b>{statusIcon(port.status)}</b>
                  </span>
                  {port.poeEnabled && <Power className="poe-mark" size={9} />}{" "}
                  {isSelected && (
                    <span className="select-mark">
                      <Check size={9} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="sfp-bays">
            <span>SFP+</span>
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <footer>
          <span>Console</span>
          <span>MGMT</span>
          <div className="legend">
            <span>
              <i className="connected" />
              Connected
            </span>
            <span>
              <i className="unused" />
              Available
            </span>
            <span>
              <i className="warning" />
              Warning
            </span>
            <span>
              <i className="uplink" />
              Trunk / uplink
            </span>
          </div>
        </footer>
      </section>
    </div>
  );
}
