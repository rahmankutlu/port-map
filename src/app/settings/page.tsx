"use client";
import { useState } from "react";
import {
  Database,
  Monitor,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import { Button, Field, Modal, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useWorkspace } from "@/features/workspace/workspace-provider";

export default function SettingsPage() {
  const { workspace, update, reset, clear } = useWorkspace();
  const { notify } = useToast();
  const [confirm, setConfirm] = useState<"reset" | "delete" | null>(null);
  if (!workspace) return null;
  const settings = workspace.settings;
  const change = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
  ) =>
    update((current) => ({
      ...current,
      settings: { ...current.settings, [key]: value },
    }));
  const execute = async () => {
    if (confirm === "reset") {
      await reset();
      notify("Demo workspace restored");
    }
    if (confirm === "delete") {
      await clear();
      notify("Local workspace deleted");
    }
    setConfirm(null);
  };
  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="07 / Local preferences"
        title="Settings"
        description="Control display preferences and locally stored data."
      />
      <Panel
        title="Appearance"
        description="Preferences apply to this browser."
      >
        <div className="settings-list">
          <div>
            <span className="settings-icon">
              <Monitor size={18} />
            </span>
            <span>
              <strong>Default theme</strong>
              <small>
                Choose light, dark, or follow your operating system.
              </small>
            </span>
            <Select
              aria-label="Default theme"
              value={settings.theme}
              onChange={(e) =>
                change("theme", e.target.value as typeof settings.theme)
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </div>
          <label>
            <span className="settings-icon">
              <Database size={18} />
            </span>
            <span>
              <strong>Compact mode</strong>
              <small>Reduce spacing in tables and forms.</small>
            </span>
            <input
              className="toggle"
              type="checkbox"
              checked={settings.compactMode}
              onChange={(e) => change("compactMode", e.target.checked)}
            />
          </label>
          <label>
            <span className="settings-icon">
              <Database size={18} />
            </span>
            <span>
              <strong>Show port labels</strong>
              <small>Display port numbers on the physical switch panel.</small>
            </span>
            <input
              className="toggle"
              type="checkbox"
              checked={settings.showPortLabels}
              onChange={(e) => change("showPortLabels", e.target.checked)}
            />
          </label>
        </div>
      </Panel>
      <Panel
        title="Defaults"
        description="Used when the application first opens."
      >
        <div className="settings-form">
          <Field label="Default switch">
            <Select
              value={settings.defaultSwitchId ?? ""}
              onChange={(e) =>
                change("defaultSwitchId", e.target.value || null)
              }
            >
              <option value="">First available switch</option>
              {workspace.switches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>
      <Panel
        title="Danger zone"
        description="These actions change or remove your local workspace."
        className="danger-panel"
      >
        <div className="danger-row">
          <span>
            <strong>Reset demo data</strong>
            <small>
              Replace the workspace with the original example environment.
            </small>
          </span>
          <Button variant="secondary" onClick={() => setConfirm("reset")}>
            <RotateCcw size={15} />
            Reset demo
          </Button>
        </div>
        <div className="danger-row">
          <span>
            <strong>Delete all local data</strong>
            <small>
              Remove switches, ports, VLANs, devices, and backups from this
              browser.
            </small>
          </span>
          <Button variant="danger" onClick={() => setConfirm("delete")}>
            <Trash2 size={15} />
            Delete all data
          </Button>
        </div>
      </Panel>
      <Modal
        open={Boolean(confirm)}
        title={
          confirm === "delete"
            ? "Delete all local data?"
            : "Reset the demo workspace?"
        }
        description="This action requires confirmation."
        onClose={() => setConfirm(null)}
      >
        <div className="modal-body warning-callout">
          <ShieldAlert size={20} />
          <span>
            {confirm === "delete"
              ? "Everything stored by Port Map in this browser will be removed. Export first if you need a recovery copy."
              : "Current switches and port assignments will be replaced by demo data."}
          </span>
        </div>
        <footer className="modal-footer">
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant={confirm === "delete" ? "danger" : "primary"}
            onClick={() => void execute()}
          >
            {confirm === "delete" ? "Delete everything" : "Reset workspace"}
          </Button>
        </footer>
      </Modal>
    </div>
  );
}
