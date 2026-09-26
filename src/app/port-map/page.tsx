"use client";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Filter,
  Power,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import {
  portStatuses,
  portTypes,
  speeds,
  type Port,
  type PortStatus,
} from "@/domain/models";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { bulkUpdatePorts, clearPorts, updatePort } from "@/services/workspace";
import { PortEditor } from "@/features/ports/port-editor";

const statusIcon = (status: PortStatus) =>
  status === "Warning" ? (
    <AlertTriangle size={10} />
  ) : status === "Disabled" ? (
    <X size={10} />
  ) : status === "Connected" ? (
    <Check size={10} />
  ) : null;

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [vlan, setVlan] = useState("");
  const [poe, setPoe] = useState("");
  const [speed, setSpeed] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Port | null>(null);
  const [queryPortDismissed, setQueryPortDismissed] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("vlan");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  const activeSwitchId =
    switchId ||
    workspace?.settings.defaultSwitchId ||
    workspace?.switches[0]?.id ||
    "";
  const activeSwitch = workspace?.switches.find(
    (item) => item.id === activeSwitchId,
  );
  const filtered = useMemo(
    () =>
      (workspace?.ports ?? [])
        .filter((port) => port.switchId === activeSwitchId)
        .filter((port) => {
          const haystack = [
            port.number,
            port.name,
            port.ipAddress,
            port.macAddress,
            port.connectedDevice,
            port.description,
            port.vlanId,
          ]
            .join(" ")
            .toLowerCase();
          return (
            (!query || haystack.includes(query.toLowerCase())) &&
            (!status || port.status === status) &&
            (!type || port.type === type) &&
            (!vlan ||
              port.vlanId === Number(vlan) ||
              port.taggedVlans.includes(Number(vlan))) &&
            (!poe || (poe === "yes") === port.poeEnabled) &&
            (!speed || port.speed === speed)
          );
        }),
    [workspace?.ports, activeSwitchId, query, status, type, vlan, poe, speed],
  );
  const activeEditor =
    editing ??
    (!queryPortDismissed
      ? workspace?.ports.find((item) => item.id === initialPortId)
      : null);
  if (!workspace) return null;
  const allSelected =
    filtered.length > 0 && filtered.every((port) => selected.includes(port.id));
  const toggle = (id: string) =>
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  const applyBulk = () => {
    if (!selected.length) return;
    if (bulkAction === "clear") update((value) => clearPorts(value, selected));
    else {
      let changes: Partial<Port> = {};
      if (bulkAction === "vlan")
        changes = { vlanId: Number(bulkValue) || null };
      if (bulkAction === "type") changes = { type: bulkValue as Port["type"] };
      if (bulkAction === "status")
        changes = { status: bulkValue as Port["status"] };
      if (bulkAction === "location") changes = { location: bulkValue };
      if (bulkAction === "notes") changes = { notes: bulkNotes };
      update((value) => bulkUpdatePorts(value, selected, changes));
    }
    notify(`${selected.length} ports updated`);
    setBulkOpen(false);
    setSelected([]);
  };
  const hasFilters = query || status || type || vlan || poe || speed;
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
              onChange={(e) => {
                setSwitchId(e.target.value);
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
          <Panel className="filter-panel">
            <div className="filter-row">
              <div className="search-box">
                <Search size={16} />
                <Input
                  aria-label="Search ports"
                  placeholder="Search port, IP, MAC, device, VLAN…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select
                aria-label="Filter status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {portStatuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
              <Select
                aria-label="Filter port type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">All types</option>
                {portTypes.map((value) => (
                  <option key={value}>{value}</option>
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
              <Select
                aria-label="Filter PoE"
                value={poe}
                onChange={(e) => setPoe(e.target.value)}
              >
                <option value="">Any PoE</option>
                <option value="yes">PoE enabled</option>
                <option value="no">No PoE</option>
              </Select>
              <Select
                aria-label="Filter speed"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
              >
                <option value="">Any speed</option>
                {speeds.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  aria-label="Clear filters"
                  onClick={() => {
                    setQuery("");
                    setStatus("");
                    setType("");
                    setVlan("");
                    setPoe("");
                    setSpeed("");
                  }}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </Panel>
          <div className="switch-chassis-wrap">
            <section className="switch-chassis">
              <header>
                <div>
                  <span className="chassis-vendor">{activeSwitch.vendor}</span>
                  <h2>{activeSwitch.name}</h2>
                  <p>
                    {activeSwitch.model} · {activeSwitch.location} ·{" "}
                    {activeSwitch.rack} {activeSwitch.rackUnit}
                  </p>
                </div>
                <div className="chassis-health">
                  <span>
                    <i />
                    Online
                  </span>
                  <strong>
                    {filtered.length}
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
                    gridTemplateColumns: `repeat(${Math.min(24, Math.ceil(activeSwitch.portCount / 2))}, minmax(32px, 1fr))`,
                  }}
                >
                  {workspace.ports
                    .filter((port) => port.switchId === activeSwitchId)
                    .map((port) => {
                      const hidden = !filtered.includes(port);
                      const isSelected = selected.includes(port.id);
                      return (
                        <button
                          key={port.id}
                          className={`physical-port status-${port.status.toLowerCase()} type-${port.type.toLowerCase()} ${hidden ? "port-dimmed" : ""} ${isSelected ? "selected" : ""}`}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey)
                              toggle(port.id);
                            else setEditing(port);
                          }}
                          title={`Port ${port.number}: ${port.connectedDevice || port.status}`}
                          aria-label={`Port ${port.number}, ${port.status}, ${port.connectedDevice || "no device"}`}
                        >
                          {workspace.settings.showPortLabels && (
                            <span className="port-number">{port.number}</span>
                          )}
                          <span className="port-jack">
                            <i />
                            <i />
                            <i />
                            <i />
                            <b>{statusIcon(port.status)}</b>
                          </span>
                          {port.poeEnabled && (
                            <Power className="poe-mark" size={9} />
                          )}{" "}
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
          <div className="selection-toolbar">
            <label>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  setSelected(
                    allSelected ? [] : filtered.map((port) => port.id),
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
          <Panel
            title="Port directory"
            description={`${filtered.length} of ${activeSwitch.portCount} physical ports`}
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
                  {filtered.map((port) => (
                    <tr key={port.id} onDoubleClick={() => setEditing(port)}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select port ${port.number}`}
                          checked={selected.includes(port.id)}
                          onChange={() => toggle(port.id)}
                        />
                      </td>
                      <td>
                        <button
                          className="table-link"
                          onClick={() => setEditing(port)}
                        >
                          {port.number}{" "}
                          {port.name && <small>{port.name}</small>}
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
                                background: workspace.vlans.find(
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
      <Modal
        open={bulkOpen}
        title={`Edit ${selected.length} ports`}
        description="The change will be applied to every selected port."
        onClose={() => setBulkOpen(false)}
      >
        <div className="modal-body">
          <Field label="Action">
            <Select
              value={bulkAction}
              onChange={(e) => {
                setBulkAction(e.target.value);
                setBulkValue("");
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
          {bulkAction === "vlan" && (
            <Field label="VLAN">
              <Select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
              >
                <option value="">Unassigned</option>
                {workspace.vlans.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.id} · {item.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {bulkAction === "type" && (
            <Field label="Port type">
              <Select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
              >
                <option value="">Choose type</option>
                {portTypes.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
          )}
          {bulkAction === "status" && (
            <Field label="State">
              <Select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
              >
                <option value="">Choose state</option>
                <option>Connected</option>
                <option>Disconnected</option>
                <option>Disabled</option>
              </Select>
            </Field>
          )}
          {bulkAction === "location" && (
            <Field label="Location">
              <Input
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
              />
            </Field>
          )}
          {bulkAction === "notes" && (
            <Field label="Notes">
              <Textarea
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
              />
            </Field>
          )}
          {bulkAction === "clear" && (
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
          <Button variant="secondary" onClick={() => setBulkOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={bulkAction === "clear" ? "danger" : "primary"}
            onClick={applyBulk}
            disabled={
              !selected.length ||
              (!["clear"].includes(bulkAction) &&
                !bulkValue &&
                bulkAction !== "vlan" &&
                bulkAction !== "notes")
            }
          >
            Apply changes
          </Button>
        </footer>
      </Modal>
    </div>
  );
}
