import { devicesFromPorts } from "@/domain/seed";
import {
  portSchema,
  switchSchema,
  workspaceImportSchema,
  workspaceSchema,
  type NetworkSwitch,
  type Port,
  type Workspace,
} from "@/domain/models";
import type { ZodIssue } from "zod";

export function createSwitch(
  input: Omit<NetworkSwitch, "id" | "createdAt" | "updatedAt">,
  workspace: Workspace,
): Workspace {
  const timestamp = new Date().toISOString();
  const id = `sw-${crypto.randomUUID()}`;
  const networkSwitch = switchSchema.parse({
    ...input,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
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
      ? portSchema.parse({
          ...port,
          ...changes,
          id: port.id,
          switchId: port.switchId,
          number: port.number,
          lastModified: new Date().toISOString(),
        })
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
      ? portSchema.parse({
          ...port,
          ...changes,
          id: port.id,
          switchId: port.switchId,
          number: port.number,
          lastModified: new Date().toISOString(),
        })
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
  return workspaceSchema.parse({
    ...workspace,
    exportedAt: new Date().toISOString(),
    devices: devicesFromPorts(workspace.ports),
  });
}

export function serializeWorkspace(workspace: Workspace): string {
  return JSON.stringify(refresh(workspace), null, 2);
}

export function parseWorkspace(value: unknown): Workspace {
  const result = workspaceImportSchema.safeParse(value);
  if (!result.success)
    throw new Error(formatWorkspaceIssues(result.error.issues, value));
  return workspaceSchema.parse({
    ...result.data,
    devices: devicesFromPorts(result.data.ports),
  });
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

function formatWorkspaceIssues(issues: ZodIssue[], value: unknown): string {
  const source = isRecord(value) ? value : {};
  const switches = Array.isArray(source.switches) ? source.switches : [];
  const ports = Array.isArray(source.ports) ? source.ports : [];
  return issues
    .slice(0, 5)
    .map((issue) => {
      if (issue.path[0] === "schemaVersion")
        return "Unsupported schema version. Expected schemaVersion 1.";
      if (/^(Port|Switch|Duplicate|VLAN|The default)/.test(issue.message))
        return withPeriod(issue.message);
      if (issue.path[0] === "switches" && typeof issue.path[1] === "number") {
        const item = switches[issue.path[1]];
        const name =
          isRecord(item) && typeof item.name === "string"
            ? item.name
            : `#${issue.path[1] + 1}`;
        return withPeriod(`Switch ${name}: ${lowercaseFirst(issue.message)}`);
      }
      if (issue.path[0] === "ports" && typeof issue.path[1] === "number") {
        const item = ports[issue.path[1]];
        const number =
          isRecord(item) && typeof item.number === "number"
            ? item.number
            : issue.path[1] + 1;
        const switchId =
          isRecord(item) && typeof item.switchId === "string"
            ? item.switchId
            : "";
        const networkSwitch = switches.find(
          (candidate) => isRecord(candidate) && candidate.id === switchId,
        );
        const switchName =
          isRecord(networkSwitch) && typeof networkSwitch.name === "string"
            ? ` on ${networkSwitch.name}`
            : "";
        return withPeriod(
          `Port ${number}${switchName}: ${lowercaseFirst(issue.message)}`,
        );
      }
      return withPeriod(`Invalid workspace: ${lowercaseFirst(issue.message)}`);
    })
    .join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function lowercaseFirst(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}

function withPeriod(value: string): string {
  return value.endsWith(".") ? value : `${value}.`;
}
