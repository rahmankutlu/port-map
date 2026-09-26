"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { portStatuses, portTypes, type Port, type Vlan } from "@/domain/models";

export type BulkPortChange =
  | { action: "clear" }
  | { action: "vlan"; changes: Pick<Port, "vlanId"> }
  | { action: "type"; changes: Pick<Port, "type"> }
  | { action: "status"; changes: Pick<Port, "status"> }
  | { action: "location"; changes: Pick<Port, "location"> }
  | { action: "notes"; changes: Pick<Port, "notes"> };

type BulkAction = BulkPortChange["action"];

export function BulkPortEditor({
  open,
  selectedCount,
  vlans,
  onClose,
  onApply,
}: {
  open: boolean;
  selectedCount: number;
  vlans: Vlan[];
  onClose: () => void;
  onApply: (change: BulkPortChange) => void;
}) {
  const [action, setAction] = useState<BulkAction>("vlan");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const apply = () => {
    if (action === "clear") return onApply({ action });
    if (action === "vlan")
      return onApply({ action, changes: { vlanId: Number(value) || null } });
    if (action === "type")
      return onApply({ action, changes: { type: value as Port["type"] } });
    if (action === "status")
      return onApply({ action, changes: { status: value as Port["status"] } });
    if (action === "location")
      return onApply({ action, changes: { location: value } });
    onApply({ action, changes: { notes } });
  };
  const requiresValue = ["type", "status", "location"].includes(action);
  return (
    <Modal
      open={open}
      title={`Edit ${selectedCount} ports`}
      description="The change will be applied to every selected port."
      onClose={onClose}
    >
      <div className="modal-body">
        <Field label="Action">
          <Select
            value={action}
            onChange={(event) => {
              setAction(event.target.value as BulkAction);
              setValue("");
            }}
          >
            <option value="vlan">Set access VLAN</option>
            <option value="type">Set port type</option>
            <option value="status">Enable / disable</option>
            <option value="location">Assign location</option>
            <option value="notes">Add notes</option>
            <option value="clear">Clear configuration</option>
          </Select>
        </Field>
        {action === "vlan" && (
          <Field label="VLAN">
            <Select
              value={value}
              onChange={(event) => setValue(event.target.value)}
            >
              <option value="">Unassigned</option>
              {vlans.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.id} · {item.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {action === "type" && (
          <Field label="Port type">
            <Select
              value={value}
              onChange={(event) => setValue(event.target.value)}
            >
              <option value="">Choose type</option>
              {portTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
        )}
        {action === "status" && (
          <Field label="State">
            <Select
              value={value}
              onChange={(event) => setValue(event.target.value)}
            >
              <option value="">Choose state</option>
              {portStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
        )}
        {action === "location" && (
          <Field label="Location">
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
        )}
        {action === "notes" && (
          <Field label="Notes">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
        )}
        {action === "clear" && (
          <div className="warning-callout">
            <ShieldAlert size={18} />
            <span>
              This removes assignments and documentation from the selected
              ports.
            </span>
          </div>
        )}
      </div>
      <footer className="modal-footer">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={action === "clear" ? "danger" : "primary"}
          onClick={apply}
          disabled={!selectedCount || (requiresValue && !value)}
        >
          Apply changes
        </Button>
      </footer>
    </Modal>
  );
}
