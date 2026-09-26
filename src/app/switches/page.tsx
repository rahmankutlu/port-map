"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Copy, MoreHorizontal, Plus, Server, Trash2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import {
  switchSchema,
  vendors,
  type NetworkSwitch,
  type Port,
} from "@/domain/models";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { createSwitch } from "@/services/workspace";

type SwitchDraft = Omit<NetworkSwitch, "id" | "createdAt" | "updatedAt">;

const empty: SwitchDraft = {
  name: "",
  hostname: "",
  managementIp: "",
  vendor: "Cisco",
  model: "",
  serialNumber: "",
  location: "",
  rack: "",
  rackUnit: "",
  portCount: 24,
  managementVlan: 10,
  description: "",
};

function toDraft(item: NetworkSwitch): SwitchDraft {
  return {
    name: item.name,
    hostname: item.hostname,
    managementIp: item.managementIp,
    vendor: item.vendor,
    model: item.model,
    serialNumber: item.serialNumber,
    location: item.location,
    rack: item.rack,
    rackUnit: item.rackUnit,
    portCount: item.portCount,
    managementVlan: item.managementVlan,
    description: item.description,
  };
}

export default function SwitchesPage() {
  const { workspace, update } = useWorkspace();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NetworkSwitch | null>(null);
  const [draft, setDraft] = useState(empty);
  const [formError, setFormError] = useState("");
  const [remove, setRemove] = useState<NetworkSwitch | null>(null);
  if (!workspace) return null;
  const launch = (item?: NetworkSwitch) => {
    setEditing(item ?? null);
    setDraft(item ? toDraft(item) : empty);
    setFormError("");
    setOpen(true);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    const timestamp = new Date().toISOString();
    const result = switchSchema.safeParse({
      ...draft,
      id: editing?.id ?? "new-switch",
      createdAt: editing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
    if (!result.success) {
      setFormError(
        result.error.issues[0]?.message ?? "Review the switch details.",
      );
      return;
    }
    const nextDraft = toDraft(result.data);
    if (
      nextDraft.managementVlan !== null &&
      !workspace.vlans.some((vlan) => vlan.id === nextDraft.managementVlan)
    ) {
      setFormError(
        `Management VLAN ${nextDraft.managementVlan} does not exist.`,
      );
      return;
    }
    if (editing) {
      update((value) => {
        let ports = value.ports;
        if (nextDraft.portCount > editing.portCount)
          ports = [
            ...ports,
            ...Array.from(
              { length: nextDraft.portCount - editing.portCount },
              (_, i): Port => ({
                id: `${editing.id}-p${editing.portCount + i + 1}`,
                switchId: editing.id,
                number: editing.portCount + i + 1,
                name: "",
                status: "Disconnected",
                type: "Unused",
                vlanId: null,
                nativeVlan: null,
                taggedVlans: [],
                connectedDevice: "",
                deviceType: "Other",
                macAddress: "",
                ipAddress: "",
                speed: "1 Gbps",
                duplex: "Auto",
                poeEnabled: false,
                poePower: null,
                description: "",
                location: nextDraft.location,
                notes: "",
                lastModified: timestamp,
              }),
            ),
          ];
        if (nextDraft.portCount < editing.portCount)
          ports = ports.filter(
            (port) =>
              port.switchId !== editing.id ||
              port.number <= nextDraft.portCount,
          );
        return {
          ...value,
          switches: value.switches.map((item) =>
            item.id === editing.id
              ? { ...item, ...nextDraft, updatedAt: timestamp }
              : item,
          ),
          ports,
          devices: value.devices.filter((device) =>
            ports.some((port) => port.id === device.portId),
          ),
        };
      });
      notify("Switch updated");
    } else {
      update((value) => createSwitch(nextDraft, value));
      notify("Switch created");
    }
    setOpen(false);
  };
  const duplicate = (item: NetworkSwitch) => {
    update((value) =>
      createSwitch(
        {
          ...item,
          name: `${item.name}-COPY`,
          hostname: `${item.hostname}-copy`,
          serialNumber: "",
        },
        value,
      ),
    );
    notify("Switch duplicated with a clean port configuration");
  };
  const confirmRemove = () => {
    if (!remove) return;
    update((value) => ({
      ...value,
      switches: value.switches.filter((item) => item.id !== remove.id),
      ports: value.ports.filter((port) => port.switchId !== remove.id),
      devices: value.devices.filter((device) => device.switchId !== remove.id),
      settings: {
        ...value.settings,
        defaultSwitchId:
          value.settings.defaultSwitchId === remove.id
            ? null
            : value.settings.defaultSwitchId,
      },
    }));
    notify("Switch deleted");
    setRemove(null);
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow="Inventory"
        title="Switches"
        description="Document managed switches, rack placement, and port capacity."
        actions={
          <Button onClick={() => launch()}>
            <Plus size={16} />
            Add switch
          </Button>
        }
      />
      {workspace.switches.length ? (
        <div className="card-grid">
          {workspace.switches.map((item) => {
            const ports = workspace.ports.filter(
              (port) => port.switchId === item.id,
            );
            const active = ports.filter(
              (port) => port.status === "Connected",
            ).length;
            return (
              <article className="switch-card" key={item.id}>
                <header>
                  <div className="switch-card-icon">
                    <Server size={20} />
                  </div>
                  <div>
                    <h2>{item.name}</h2>
                    <p>{item.hostname || "No hostname"}</p>
                  </div>
                  <details className="menu">
                    <summary aria-label="Switch actions">
                      <MoreHorizontal size={18} />
                    </summary>
                    <div>
                      <button onClick={() => launch(item)}>Edit details</button>
                      <button onClick={() => duplicate(item)}>
                        <Copy size={14} />
                        Duplicate
                      </button>
                      <button
                        className="danger-text"
                        onClick={() => setRemove(item)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </details>
                </header>
                <div className="switch-card-meta">
                  <span>
                    <b>Management</b>
                    {item.managementIp || "Not set"}
                  </span>
                  <span>
                    <b>Platform</b>
                    {item.vendor} {item.model}
                  </span>
                  <span>
                    <b>Location</b>
                    {item.location || "Not set"}
                  </span>
                  <span>
                    <b>Rack</b>
                    {item.rack ? `${item.rack} · ${item.rackUnit}` : "Not set"}
                  </span>
                </div>
                <div className="port-util">
                  <div>
                    <span>Port utilization</span>
                    <strong>
                      {active} / {item.portCount}
                    </strong>
                  </div>
                  <div>
                    <i
                      style={{ width: `${(active / item.portCount) * 100}%` }}
                    />
                  </div>
                </div>
                <footer>
                  <Badge tone="blue">Documented</Badge>
                  <span>{item.description}</span>
                  <Link
                    className="button button-secondary"
                    href={`/port-map?switch=${item.id}`}
                  >
                    View ports
                  </Link>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <Panel>
          <EmptyState
            icon={<Server />}
            title="No switches yet"
            description="Add your first switch to generate its physical port map."
            action={
              <Button onClick={() => launch()}>
                <Plus size={16} />
                Add switch
              </Button>
            }
          />
        </Panel>
      )}
      <Modal
        open={open}
        title={editing ? "Edit switch" : "Add switch"}
        description="Hardware metadata is used for documentation only."
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit}>
          <div className="modal-body form-grid two">
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <Field label="Name">
              <Input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="ACCESS-SW-03"
              />
            </Field>
            <Field label="Hostname">
              <Input
                value={draft.hostname}
                onChange={(e) =>
                  setDraft({ ...draft, hostname: e.target.value })
                }
              />
            </Field>
            <Field label="Management IP">
              <Input
                value={draft.managementIp}
                aria-invalid={Boolean(formError) || undefined}
                onChange={(e) =>
                  setDraft({ ...draft, managementIp: e.target.value })
                }
              />
            </Field>
            <Field label="Vendor">
              <Select
                value={draft.vendor}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    vendor: e.target.value as NetworkSwitch["vendor"],
                  })
                }
              >
                {vendors.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="Model">
              <Input
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              />
            </Field>
            <Field label="Serial number">
              <Input
                value={draft.serialNumber}
                onChange={(e) =>
                  setDraft({ ...draft, serialNumber: e.target.value })
                }
              />
            </Field>
            <Field label="Location">
              <Input
                value={draft.location}
                onChange={(e) =>
                  setDraft({ ...draft, location: e.target.value })
                }
              />
            </Field>
            <Field label="Rack">
              <Input
                value={draft.rack}
                onChange={(e) => setDraft({ ...draft, rack: e.target.value })}
              />
            </Field>
            <Field label="Rack unit">
              <Input
                value={draft.rackUnit}
                onChange={(e) =>
                  setDraft({ ...draft, rackUnit: e.target.value })
                }
              />
            </Field>
            <Field label="Port count">
              <Select
                value={
                  [8, 16, 24, 48].includes(draft.portCount)
                    ? draft.portCount
                    : "custom"
                }
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    portCount:
                      e.target.value === "custom" ? 1 : Number(e.target.value),
                  })
                }
              >
                {[8, 16, 24, 48].map((value) => (
                  <option key={value} value={value}>
                    {value} ports
                  </option>
                ))}
                <option value="custom">Custom</option>
              </Select>
              {![8, 16, 24, 48].includes(draft.portCount) && (
                <Input
                  type="number"
                  min={1}
                  max={256}
                  value={draft.portCount}
                  onChange={(e) =>
                    setDraft({ ...draft, portCount: Number(e.target.value) })
                  }
                />
              )}
            </Field>
            <Field label="Management VLAN">
              <Input
                type="number"
                min={1}
                max={4094}
                value={draft.managementVlan ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    managementVlan: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Field>
          </div>
          <footer className="modal-footer">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editing ? "Save changes" : "Create switch"}
            </Button>
          </footer>
        </form>
      </Modal>
      <Modal
        open={Boolean(remove)}
        title="Delete switch?"
        description="Its port assignments and documented devices will also be removed."
        onClose={() => setRemove(null)}
      >
        <div className="modal-body warning-callout">
          <Trash2 size={18} />
          <span>
            <strong>{remove?.name}</strong> cannot be recovered unless it exists
            in a backup.
          </span>
        </div>
        <footer className="modal-footer">
          <Button variant="secondary" onClick={() => setRemove(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRemove}>
            Delete switch
          </Button>
        </footer>
      </Modal>
    </div>
  );
}
