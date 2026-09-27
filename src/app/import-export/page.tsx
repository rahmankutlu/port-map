"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  Download,
  FileJson,
  History,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import { Badge, Button, EmptyState, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { workspaceRepository, type Backup } from "@/data/repository";
import type { Workspace } from "@/domain/models";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { parseWorkspaceJson, serializeWorkspace } from "@/services/workspace";

export default function ImportExportPage() {
  const { workspace, replace } = useWorkspace();
  const { notify } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [pending, setPending] = useState<Workspace | null>(null);
  const [restore, setRestore] = useState<Backup | null>(null);
  const [error, setError] = useState("");
  const loadBackups = useCallback(() => {
    void workspaceRepository.listBackups().then(setBackups);
  }, []);
  useEffect(loadBackups, [loadBackups]);
  if (!workspace) return null;
  const download = () => {
    const blob = new Blob([serializeWorkspace(workspace)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `port-map-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    notify("Workspace exported");
  };
  const read = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      const imported = parseWorkspaceJson(await file.text());
      setPending(imported);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The file could not be imported.",
      );
    } finally {
      if (input.current) input.current.value = "";
    }
  };
  const confirmImport = async () => {
    if (!pending) return;
    await workspaceRepository.createBackup(workspace, "Before JSON import");
    await replace(pending);
    setPending(null);
    loadBackups();
    notify("Workspace imported successfully");
  };
  const createBackup = async () => {
    await workspaceRepository.createBackup(workspace);
    loadBackups();
    notify("Backup created");
  };
  const confirmRestore = async () => {
    if (!restore) return;
    await workspaceRepository.createBackup(workspace, "Before backup restore");
    await replace(restore.workspace);
    setRestore(null);
    loadBackups();
    notify("Backup restored");
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow="Data portability"
        title="Import / Export"
        description="Move or safeguard the complete local workspace using a versioned JSON file."
        actions={
          <Button onClick={download}>
            <Download size={16} />
            Export workspace
          </Button>
        }
      />
      <div className="dashboard-grid">
        <Panel
          title="Export workspace"
          description="Download switches, ports, VLANs, devices, and settings."
        >
          <div className="action-card">
            <span className="action-icon">
              <FileJson size={22} />
            </span>
            <div>
              <strong>Port Map JSON</strong>
              <p>
                Schema version 1 · {workspace.switches.length} switches ·{" "}
                {workspace.ports.length} ports
              </p>
            </div>
            <Button variant="secondary" onClick={download}>
              <Download size={15} />
              Download
            </Button>
          </div>
        </Panel>
        <Panel
          title="Import workspace"
          description="Files are validated before any data is changed."
        >
          <div className="action-card">
            <span className="action-icon">
              <Upload size={22} />
            </span>
            <div>
              <strong>Choose a JSON export</strong>
              <p>An automatic backup is created before replacement.</p>
            </div>
            <input
              ref={input}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={(e) => void read(e.target.files?.[0])}
            />
            <Button variant="secondary" onClick={() => input.current?.click()}>
              <Upload size={15} />
              Choose file
            </Button>
          </div>
          {error && (
            <div className="error-callout" role="alert">
              {error}
            </div>
          )}
        </Panel>
      </div>
      <Panel
        title="Local backups"
        description="Snapshots stay in this browser and are not included in exports."
        action={
          <Button variant="secondary" onClick={() => void createBackup()}>
            <Archive size={15} />
            Create backup
          </Button>
        }
      >
        {backups.length ? (
          <div className="backup-list">
            {backups.map((backup) => (
              <div key={backup.id}>
                <span className="backup-icon">
                  <History size={18} />
                </span>
                <span>
                  <strong>{backup.label}</strong>
                  <small>
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(backup.createdAt))}{" "}
                    · {backup.workspace.switches.length} switches
                  </small>
                </span>
                <Badge tone="green">
                  <ShieldCheck size={12} />
                  Valid
                </Badge>
                <Button variant="secondary" onClick={() => setRestore(backup)}>
                  <RotateCcw size={14} />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Archive />}
            title="No backups yet"
            description="Create a snapshot before making broad configuration changes."
          />
        )}
      </Panel>
      <Modal
        open={Boolean(pending)}
        title="Replace current workspace?"
        description="The imported configuration passed schema validation."
        onClose={() => setPending(null)}
      >
        <div className="modal-body import-summary">
          <ShieldCheck size={22} />
          <div>
            <strong>Valid Port Map workspace</strong>
            <p>
              {pending?.switches.length} switches, {pending?.ports.length}{" "}
              ports, and {pending?.vlans.length} VLANs will replace the current
              workspace. A backup will be created first.
            </p>
          </div>
        </div>
        <footer className="modal-footer">
          <Button variant="secondary" onClick={() => setPending(null)}>
            Cancel
          </Button>
          <Button onClick={() => void confirmImport()}>Import workspace</Button>
        </footer>
      </Modal>
      <Modal
        open={Boolean(restore)}
        title="Restore this backup?"
        description="The current workspace will be backed up automatically."
        onClose={() => setRestore(null)}
      >
        <div className="modal-body">
          <p>
            <strong>{restore?.label}</strong>
            <br />
            {restore && new Date(restore.createdAt).toLocaleString()}
          </p>
        </div>
        <footer className="modal-footer">
          <Button variant="secondary" onClick={() => setRestore(null)}>
            Cancel
          </Button>
          <Button onClick={() => void confirmRestore()}>Restore backup</Button>
        </footer>
      </Modal>
    </div>
  );
}
