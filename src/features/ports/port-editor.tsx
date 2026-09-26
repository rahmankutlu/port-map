"use client";
import { useState, type FormEvent } from "react";
import { Activity, Cable, Clock3, Power, X } from "lucide-react";
import type { Port, Vlan } from "@/domain/models";
import { deviceTypes, portStatuses, portTypes, speeds } from "@/domain/models";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";

export function PortEditor({
  port,
  vlans,
  onClose,
  onSave,
}: {
  port: Port;
  vlans: Vlan[];
  onClose: () => void;
  onSave: (changes: Partial<Port>) => void;
}) {
  const [draft, setDraft] = useState(port);
  const set = <K extends keyof Port>(key: K, value: Port[K]) =>
    setDraft((item) => ({ ...item, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(draft);
  };
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="port-drawer-title"
      >
        <header className="drawer-header">
          <div className="port-title-icon">
            <Cable size={20} />
          </div>
          <div>
            <span>Port {port.number}</span>
            <h2 id="port-drawer-title">{port.name || "Unlabeled port"}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close port details"
          >
            <X size={19} />
          </button>
        </header>
        <div className="drawer-summary">
          <Badge
            tone={
              draft.status === "Connected"
                ? "green"
                : draft.status === "Warning"
                  ? "amber"
                  : draft.status === "Disabled"
                    ? "red"
                    : "neutral"
            }
          >
            <Activity size={12} />
            {draft.status}
          </Badge>
          <Badge
            tone={["Trunk", "Uplink"].includes(draft.type) ? "purple" : "blue"}
          >
            {draft.type}
          </Badge>
          {draft.poeEnabled && (
            <Badge tone="amber">
              <Power size={12} />
              {draft.poePower ?? 0} W
            </Badge>
          )}
        </div>
        <form onSubmit={submit}>
          <div className="drawer-body">
            <div className="form-grid two">
              <Field label="Port name">
                <Input
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Reception AP"
                />
              </Field>
              <Field label="Status">
                <Select
                  value={draft.status}
                  onChange={(e) =>
                    set("status", e.target.value as Port["status"])
                  }
                >
                  {portStatuses.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Port type">
                <Select
                  value={draft.type}
                  onChange={(e) => set("type", e.target.value as Port["type"])}
                >
                  {portTypes.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Access VLAN">
                <Select
                  value={draft.vlanId ?? ""}
                  onChange={(e) =>
                    set(
                      "vlanId",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                >
                  <option value="">None</option>
                  {vlans.map((vlan) => (
                    <option value={vlan.id} key={vlan.id}>
                      {vlan.id} · {vlan.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Native VLAN">
                <Input
                  type="number"
                  min={1}
                  max={4094}
                  value={draft.nativeVlan ?? ""}
                  onChange={(e) =>
                    set(
                      "nativeVlan",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </Field>
              <Field label="Tagged VLANs" hint="Comma-separated VLAN IDs">
                <Input
                  value={draft.taggedVlans.join(", ")}
                  onChange={(e) =>
                    set(
                      "taggedVlans",
                      e.target.value
                        .split(",")
                        .map(Number)
                        .filter((value) => value >= 1 && value <= 4094),
                    )
                  }
                />
              </Field>
            </div>
            <div className="form-section">
              <h3>Connected device</h3>
              <div className="form-grid two">
                <Field label="Device name">
                  <Input
                    value={draft.connectedDevice}
                    onChange={(e) => set("connectedDevice", e.target.value)}
                    placeholder="AP-FLOOR-01"
                  />
                </Field>
                <Field label="Device type">
                  <Select
                    value={draft.deviceType}
                    onChange={(e) =>
                      set("deviceType", e.target.value as Port["deviceType"])
                    }
                  >
                    {deviceTypes.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="IP address">
                  <Input
                    value={draft.ipAddress}
                    onChange={(e) => set("ipAddress", e.target.value)}
                    placeholder="10.20.1.42"
                  />
                </Field>
                <Field label="MAC address">
                  <Input
                    value={draft.macAddress}
                    onChange={(e) => set("macAddress", e.target.value)}
                    placeholder="00:00:00:00:00:00"
                  />
                </Field>
                <Field label="Speed">
                  <Select
                    value={draft.speed}
                    onChange={(e) =>
                      set("speed", e.target.value as Port["speed"])
                    }
                  >
                    {speeds.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Duplex">
                  <Select
                    value={draft.duplex}
                    onChange={(e) =>
                      set("duplex", e.target.value as Port["duplex"])
                    }
                  >
                    {["Auto", "Full", "Half"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
            <div className="form-section">
              <h3>Power & documentation</h3>
              <div className="form-grid two">
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={draft.poeEnabled}
                    onChange={(e) => set("poeEnabled", e.target.checked)}
                  />
                  <span>
                    <strong>Power over Ethernet</strong>
                    <small>Port supplies power to the endpoint</small>
                  </span>
                </label>
                <Field label="PoE power (watts)">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    disabled={!draft.poeEnabled}
                    value={draft.poePower ?? ""}
                    onChange={(e) =>
                      set(
                        "poePower",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </Field>
                <Field label="Location">
                  <Input
                    value={draft.location}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </Field>
                <Field label="Description">
                  <Input
                    value={draft.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
                <Field label="Notes">
                  <Textarea
                    value={draft.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
              </div>
            </div>
            <div className="modified">
              <Clock3 size={14} />
              Last modified{" "}
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(port.lastModified))}
            </div>
          </div>
          <footer className="drawer-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save port</Button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
