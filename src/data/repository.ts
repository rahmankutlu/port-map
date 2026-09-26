import { openDB, type DBSchema } from "idb";
import type { Workspace } from "@/domain/models";

interface PortMapDb extends DBSchema {
  workspace: { key: string; value: Workspace };
  backups: {
    key: string;
    value: {
      id: string;
      createdAt: string;
      label: string;
      workspace: Workspace;
    };
    indexes: { "by-date": string };
  };
}

const db = () =>
  openDB<PortMapDb>("port-map", 1, {
    upgrade(database) {
      database.createObjectStore("workspace");
      const backups = database.createObjectStore("backups", { keyPath: "id" });
      backups.createIndex("by-date", "createdAt");
    },
  });

export type Backup = PortMapDb["backups"]["value"];
export const workspaceRepository = {
  async load() {
    return (await db()).get("workspace", "current");
  },
  async save(workspace: Workspace) {
    await (await db()).put("workspace", workspace, "current");
  },
  async clear() {
    const database = await db();
    await Promise.all([database.clear("workspace"), database.clear("backups")]);
  },
  async createBackup(workspace: Workspace, label = "Manual backup") {
    const backup = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      label,
      workspace,
    };
    await (await db()).put("backups", backup);
    return backup;
  },
  async listBackups() {
    return (await (await db()).getAllFromIndex("backups", "by-date")).reverse();
  },
  async deleteBackup(id: string) {
    await (await db()).delete("backups", id);
  },
};
