"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createDemoWorkspace } from "@/domain/seed";
import type { Workspace } from "@/domain/models";
import { workspaceRepository } from "@/data/repository";

type Context = {
  workspace: Workspace | null;
  ready: boolean;
  replace: (workspace: Workspace) => Promise<void>;
  update: (recipe: (workspace: Workspace) => Workspace) => void;
  reset: () => Promise<void>;
  clear: () => Promise<void>;
};
const WorkspaceContext = createContext<Context | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void workspaceRepository
      .load()
      .then(async (saved) => {
        const next = saved ?? createDemoWorkspace();
        if (!saved) await workspaceRepository.save(next);
        if (active) {
          setWorkspace(next);
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setWorkspace(createDemoWorkspace());
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  const replace = useCallback(async (next: Workspace) => {
    setWorkspace(next);
    await workspaceRepository.save(next);
  }, []);
  const update = useCallback((recipe: (value: Workspace) => Workspace) => {
    setWorkspace((current) => {
      if (!current) return current;
      const next = recipe(current);
      void workspaceRepository.save(next);
      return next;
    });
  }, []);
  const reset = useCallback(
    async () => replace(createDemoWorkspace()),
    [replace],
  );
  const clear = useCallback(async () => {
    await workspaceRepository.clear();
    const blank = createDemoWorkspace();
    blank.switches = [];
    blank.ports = [];
    blank.vlans = [];
    blank.devices = [];
    blank.settings.defaultSwitchId = null;
    await replace(blank);
  }, [replace]);
  return (
    <WorkspaceContext.Provider
      value={{ workspace, ready, replace, update, reset, clear }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value)
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}
