import { beforeEach, describe, expect, it } from "vitest";
import { createDemoWorkspace } from "@/domain/seed";
import { workspaceRepository } from "./repository";

describe("IndexedDB repository", () => {
  beforeEach(async () => workspaceRepository.clear());
  it("persists a workspace and creates restorable backups", async () => {
    const workspace = createDemoWorkspace();
    await workspaceRepository.save(workspace);
    expect((await workspaceRepository.load())?.switches).toHaveLength(3);
    await workspaceRepository.createBackup(workspace, "Test backup");
    const backups = await workspaceRepository.listBackups();
    expect(backups).toHaveLength(1);
    expect(backups[0].label).toBe("Test backup");
    expect(backups[0].workspace.ports).toHaveLength(96);
  });
});
