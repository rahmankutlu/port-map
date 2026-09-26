"use client";
import { useState, type FormEvent } from "react";
import { Layers3, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { vlanSchema, type Vlan } from "@/domain/models";
import { devicesFromPorts } from "@/domain/seed";
import { useWorkspace } from "@/features/workspace/workspace-provider";

const blank: Vlan = { id: 100, name: "", description: "", color: "#64748b" };
export default function VlansPage() {
  const { workspace, update } = useWorkspace();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Vlan>(blank);
  const [error, setError] = useState("");
  const [remove, setRemove] = useState<Vlan | null>(null);
  if (!workspace) return null;
  const launch = (item?: Vlan) => {
    setDraft(
      item ?? {
        ...blank,
        id: Math.max(1, ...workspace.vlans.map((vlan) => vlan.id)) + 10,
      },
    );
    setEditingId(item?.id ?? null);
    setError("");
    setOpen(true);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = vlanSchema.safeParse(draft);
    if (!result.success)
      return setError(
        result.error.issues[0]?.message ?? "Check the VLAN details",
      );
    if (
      workspace.vlans.some(
        (item) => item.id === draft.id && item.id !== editingId,
      )
    )
      return setError("That VLAN ID already exists");
    update((value) => {
      const ports =
        editingId !== null && editingId !== draft.id
          ? value.ports.map((port) => ({
              ...port,
              vlanId: port.vlanId === editingId ? draft.id : port.vlanId,
              nativeVlan:
                port.nativeVlan === editingId ? draft.id : port.nativeVlan,
              taggedVlans: port.taggedVlans.map((id) =>
                id === editingId ? draft.id : id,
              ),
            }))
          : value.ports;
      return {
        ...value,
        switches:
          editingId !== null && editingId !== draft.id
            ? value.switches.map((networkSwitch) => ({
                ...networkSwitch,
                managementVlan:
                  networkSwitch.managementVlan === editingId
                    ? draft.id
                    : networkSwitch.managementVlan,
              }))
            : value.switches,
        vlans:
          editingId === null
            ? [...value.vlans, result.data].sort((a, b) => a.id - b.id)
            : value.vlans.map((item) =>
                item.id === editingId ? result.data : item,
              ),
        ports,
        devices: devicesFromPorts(ports),
      };
    });
    notify(editingId === null ? "VLAN created" : "VLAN updated");
    setOpen(false);
  };
  const deleteVlan = () => {
    if (!remove) return;
    update((value) => {
      const ports = value.ports.map((port) => ({
        ...port,
        vlanId: port.vlanId === remove.id ? null : port.vlanId,
        nativeVlan: port.nativeVlan === remove.id ? null : port.nativeVlan,
        taggedVlans: port.taggedVlans.filter((id) => id !== remove.id),
      }));
      return {
        ...value,
        switches: value.switches.map((networkSwitch) => ({
          ...networkSwitch,
          managementVlan:
            networkSwitch.managementVlan === remove.id
              ? null
              : networkSwitch.managementVlan,
        })),
        vlans: value.vlans.filter((item) => item.id !== remove.id),
        ports,
        devices: devicesFromPorts(ports),
      };
    });
    notify("VLAN removed and references cleared");
    setRemove(null);
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow="04 / Segmentation register"
        title="VLANs"
        description="Maintain the VLAN catalog used across port assignments."
        actions={
          <Button onClick={() => launch()}>
            <Plus size={16} />
            Add VLAN
          </Button>
        }
      />
      <Panel>
        {workspace.vlans.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>VLAN</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Ports</th>
                  <th>Switches</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {workspace.vlans.map((vlan) => {
                  const ports = workspace.ports.filter(
                    (port) =>
                      port.vlanId === vlan.id ||
                      port.nativeVlan === vlan.id ||
                      port.taggedVlans.includes(vlan.id),
                  );
                  const switchCount = new Set(
                    ports.map((port) => port.switchId),
                  ).size;
                  return (
                    <tr key={vlan.id}>
                      <td>
                        <span className="vlan-id">
                          <i style={{ background: vlan.color }} />
                          {vlan.id}
                        </span>
                      </td>
                      <td>
                        <strong>{vlan.name}</strong>
                      </td>
                      <td>{vlan.description || "—"}</td>
                      <td>{ports.length}</td>
                      <td>{switchCount}</td>
                      <td className="actions-cell">
                        <details className="menu">
                          <summary aria-label={`Actions for VLAN ${vlan.id}`}>
                            <MoreHorizontal size={18} />
                          </summary>
                          <div>
                            <button onClick={() => launch(vlan)}>
                              Edit VLAN
                            </button>
                            <button
                              className="danger-text"
                              onClick={() => setRemove(vlan)}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Layers3 />}
            title="No VLANs configured"
            description="Create a VLAN before assigning it to access ports."
            action={
              <Button onClick={() => launch()}>
                <Plus size={16} />
                Add VLAN
              </Button>
            }
          />
        )}
      </Panel>
      <Modal
        open={open}
        title={editingId === null ? "Add VLAN" : "Edit VLAN"}
        description="Valid IEEE 802.1Q VLAN IDs range from 1 to 4094."
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit}>
          <div className="modal-body form-grid two">
            <Field label="VLAN ID">
              <Input
                required
                type="number"
                min={1}
                max={4094}
                value={draft.id}
                onChange={(e) =>
                  setDraft({ ...draft, id: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Name">
              <Input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Color identifier">
              <div className="color-input">
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) =>
                    setDraft({ ...draft, color: e.target.value })
                  }
                />
                <Input
                  value={draft.color}
                  pattern="^#[0-9a-fA-F]{6}$"
                  onChange={(e) =>
                    setDraft({ ...draft, color: e.target.value })
                  }
                />
              </div>
            </Field>
            <Field label="Description">
              <Textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Field>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <footer className="modal-footer">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save VLAN</Button>
          </footer>
        </form>
      </Modal>
      <Modal
        open={Boolean(remove)}
        title={`Delete VLAN ${remove?.id}?`}
        description="This clears the VLAN from every port where it is referenced."
        onClose={() => setRemove(null)}
      >
        <div className="modal-body warning-callout">
          <Trash2 size={18} />
          <span>
            Port documentation will remain, but assignments to{" "}
            <strong>{remove?.name}</strong> will be removed.
          </span>
        </div>
        <footer className="modal-footer">
          <Button variant="secondary" onClick={() => setRemove(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteVlan}>
            Delete VLAN
          </Button>
        </footer>
      </Modal>
    </div>
  );
}
