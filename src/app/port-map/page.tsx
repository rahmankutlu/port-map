"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import { Button, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { Port } from "@/domain/models";
import {
  BulkPortEditor,
  type BulkPortChange,
} from "@/features/ports/bulk-port-editor";
import { PortDirectory } from "@/features/ports/port-directory";
import { PortEditor } from "@/features/ports/port-editor";
import { PortFilters } from "@/features/ports/port-filters";
import { SwitchChassis } from "@/features/ports/switch-chassis";
import { usePortFilters } from "@/features/ports/use-port-filters";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { bulkUpdatePorts, clearPorts, updatePort } from "@/services/workspace";

export default function PortMapPage() {
  const { workspace, update } = useWorkspace();
  const { notify } = useToast();
  const [switchId, setSwitchId] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("switch") ?? ""),
  );
  const [initialPortId] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("port") ?? ""),
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Port | null>(null);
  const [queryPortDismissed, setQueryPortDismissed] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const activeSwitchId =
    switchId ||
    workspace?.settings.defaultSwitchId ||
    workspace?.switches[0]?.id ||
    "";
  const activeSwitch = workspace?.switches.find(
    (item) => item.id === activeSwitchId,
  );
  const activeSwitchPorts = useMemo(
    () =>
      (workspace?.ports ?? []).filter(
        (port) => port.switchId === activeSwitchId,
      ),
    [workspace?.ports, activeSwitchId],
  );
  const filters = usePortFilters(workspace?.ports ?? [], activeSwitchId);
  const shownPortIds = useMemo(
    () => new Set(filters.filtered.map((port) => port.id)),
    [filters.filtered],
  );
  const selectedPortIds = useMemo(() => new Set(selected), [selected]);
  const activeEditor =
    editing ??
    (!queryPortDismissed
      ? workspace?.ports.find((item) => item.id === initialPortId)
      : null);

  if (!workspace) return null;

  const allSelected =
    filters.filtered.length > 0 &&
    filters.filtered.every((port) => selectedPortIds.has(port.id));
  const togglePort = (id: string) =>
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  const applyBulk = (change: BulkPortChange) => {
    if (!selected.length) return;
    if (change.action === "clear")
      update((value) => clearPorts(value, selected));
    else update((value) => bulkUpdatePorts(value, selected, change.changes));
    notify(`${selected.length} ports updated`);
    setBulkOpen(false);
    setSelected([]);
  };

  return (
    <div className="page port-map-page">
      <PageHeader
        eyebrow="Physical inventory"
        title="Port map"
        description="Inspect and update physical connections without leaving the switch panel."
        actions={
          <div className="switch-picker">
            <label htmlFor="switch-picker">Switch</label>
            <Select
              id="switch-picker"
              value={activeSwitchId}
              onChange={(event) => {
                setSwitchId(event.target.value);
                setSelected([]);
              }}
            >
              <option value="" disabled>
                Select a switch
              </option>
              {workspace.switches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.portCount} ports
                </option>
              ))}
            </Select>
          </div>
        }
      />
      {!activeSwitch ? (
        <Panel>
          <div className="inline-empty">
            Create a switch to begin mapping ports.
          </div>
        </Panel>
      ) : (
        <>
          <PortFilters filters={filters} vlans={workspace.vlans} />
          <SwitchChassis
            networkSwitch={activeSwitch}
            ports={activeSwitchPorts}
            shownPortIds={shownPortIds}
            selectedPortIds={selectedPortIds}
            showPortLabels={workspace.settings.showPortLabels}
            onOpenPort={setEditing}
            onTogglePort={togglePort}
          />
          <div className="selection-toolbar">
            <label>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  setSelected(
                    allSelected ? [] : filters.filtered.map((port) => port.id),
                  )
                }
              />
              <span>
                {selected.length
                  ? `${selected.length} selected`
                  : "Select all shown"}
              </span>
            </label>
            {selected.length > 0 && (
              <>
                <Button variant="secondary" onClick={() => setBulkOpen(true)}>
                  <Filter size={15} />
                  Bulk edit
                  <ChevronDown size={14} />
                </Button>
                <Button variant="ghost" onClick={() => setSelected([])}>
                  Clear
                </Button>
              </>
            )}
          </div>
          <PortDirectory
            ports={filters.filtered}
            totalPorts={activeSwitch.portCount}
            vlans={workspace.vlans}
            selectedPortIds={selectedPortIds}
            onTogglePort={togglePort}
            onEditPort={setEditing}
          />
        </>
      )}
      {activeEditor && (
        <PortEditor
          port={activeEditor}
          vlans={workspace.vlans}
          onClose={() => {
            setEditing(null);
            setQueryPortDismissed(true);
          }}
          onSave={(changes) => {
            update((value) => updatePort(value, activeEditor.id, changes));
            setEditing(null);
            setQueryPortDismissed(true);
            notify(`Port ${activeEditor.number} saved`);
          }}
        />
      )}
      <BulkPortEditor
        open={bulkOpen}
        selectedCount={selected.length}
        vlans={workspace.vlans}
        onClose={() => setBulkOpen(false)}
        onApply={applyBulk}
      />
    </div>
  );
}
