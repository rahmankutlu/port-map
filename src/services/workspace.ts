import { devicesFromPorts } from "@/domain/seed";
import {
  workspaceSchema,
  type NetworkSwitch,
  type Port,
  type Workspace,
} from "@/domain/models";

export function createSwitch(
  input: Omit<NetworkSwitch, "id" | "createdAt" | "updatedAt">,
  workspace: Workspace,
): Workspace {
  const timestamp = new Date().toISOString();
  const id = `sw-${crypto.randomUUID()}`;
  const networkSwitch: NetworkSwitch = {
    ...input,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const ports: Port[] = Array.from({ length: input.portCount }, (_, index) => ({
    id: `${id}-p${index + 1}`,
    switchId: id,
    number: index + 1,
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
    location: input.location,
    notes: "",
    lastModified: timestamp,
  }));
  return refresh({
    ...workspace,
    switches: [...workspace.switches, networkSwitch],
    ports: [...workspace.ports, ...ports],
  });
}

export function updatePort(
  workspace: Workspace,
  portId: string,
  changes: Partial<Port>,
): Workspace {
  const ports = workspace.ports.map((port) =>
    port.id === portId
      ? {
          ...port,
          ...changes,
          id: port.id,
          switchId: port.switchId,
          number: port.number,
          lastModified: new Date().toISOString(),
        }
      : port,
  );
  return refresh({ ...workspace, ports });
}

export function bulkUpdatePorts(
  workspace: Workspace,
  portIds: string[],
  changes: Partial<Port>,
): Workspace {
  const selected = new Set(portIds);
  const ports = workspace.ports.map((port) =>
    selected.has(port.id)
      ? {
          ...port,
          ...changes,
          id: port.id,
          switchId: port.switchId,
          number: port.number,
          lastModified: new Date().toISOString(),
        }
      : port,
  );
  return refresh({ ...workspace, ports });
}

export function clearPorts(workspace: Workspace, portIds: string[]): Workspace {
  return bulkUpdatePorts(workspace, portIds, {
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
    poeEnabled: false,
    poePower: null,
    description: "",
    notes: "",
  });
}

function refresh(workspace: Workspace): Workspace {
  return {
    ...workspace,
    exportedAt: new Date().toISOString(),
    devices: devicesFromPorts(workspace.ports),
  };
}

export function serializeWorkspace(workspace: Workspace): string {
  return JSON.stringify(refresh(workspace), null, 2);
}

export function parseWorkspace(value: unknown): Workspace {
  const result = workspaceSchema.safeParse(value);
  if (!result.success)
    throw new Error(
      result.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".") || "file"}: ${issue.message}`)
        .join("; "),
    );
  return result.data;
}

export function parseWorkspaceJson(text: string): Workspace {
  try {
    return parseWorkspace(JSON.parse(text) as unknown);
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error("The selected file is not valid JSON.");
    throw error;
  }
}
