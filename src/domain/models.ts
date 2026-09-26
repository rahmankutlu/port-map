import { z } from "zod";
import {
  isValidIpAddress,
  isValidMacAddress,
  normalizeMacAddress,
} from "./network-address";

export const vendors = [
  "Aruba",
  "HPE",
  "Cisco",
  "Juniper",
  "Ubiquiti",
  "MikroTik",
  "TP-Link",
  "Netgear",
  "Other",
] as const;
export const portStatuses = [
  "Connected",
  "Disconnected",
  "Disabled",
  "Warning",
] as const;
export const portTypes = [
  "Access",
  "Trunk",
  "Uplink",
  "Management",
  "Unused",
] as const;
export const speeds = [
  "10 Mbps",
  "100 Mbps",
  "1 Gbps",
  "2.5 Gbps",
  "5 Gbps",
  "10 Gbps",
  "25 Gbps",
  "40 Gbps",
  "100 Gbps",
] as const;
export const deviceTypes = [
  "Access Point",
  "IP Phone",
  "Camera",
  "Server",
  "Printer",
  "Workstation",
  "POS",
  "IPTV",
  "IoT",
  "Switch",
  "Router",
  "Firewall",
  "Other",
] as const;

const text = z.string().trim().max(500);
const nullableText = z.string().trim().max(500).default("");
const optionalIpAddress = nullableText.refine(
  (value) => !value || isValidIpAddress(value),
  "Must be a valid IPv4 or IPv6 address",
);
const optionalMacAddress = nullableText
  .refine(
    (value) => !value || isValidMacAddress(value),
    "Must be a MAC address with colon- or hyphen-separated octets",
  )
  .transform((value) => (value ? normalizeMacAddress(value) : ""));

export const vlanSchema = z.object({
  id: z
    .number()
    .int()
    .min(1, "VLAN ID must be at least 1")
    .max(4094, "VLAN ID must be 4094 or lower"),
  name: z.string().trim().min(1, "Name is required").max(80),
  description: nullableText,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color"),
});

export const switchSchema = z.object({
  id: z.string().min(1),
  name: text.min(1),
  hostname: nullableText,
  managementIp: optionalIpAddress,
  vendor: z.enum(vendors),
  model: nullableText,
  serialNumber: nullableText,
  location: nullableText,
  rack: nullableText,
  rackUnit: nullableText,
  portCount: z.number().int().min(1).max(256),
  managementVlan: z.number().int().min(1).max(4094).nullable(),
  description: nullableText,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const portSchema = z
  .object({
    id: z.string().min(1),
    switchId: z.string().min(1),
    number: z.number().int().positive(),
    name: nullableText,
    status: z.enum(portStatuses),
    type: z.enum(portTypes),
    vlanId: z.number().int().min(1).max(4094).nullable(),
    nativeVlan: z.number().int().min(1).max(4094).nullable(),
    taggedVlans: z.array(z.number().int().min(1).max(4094)),
    connectedDevice: nullableText,
    deviceType: z.enum(deviceTypes),
    macAddress: optionalMacAddress,
    ipAddress: optionalIpAddress,
    speed: z.enum(speeds),
    duplex: z.enum(["Full", "Half", "Auto"]),
    poeEnabled: z.boolean(),
    poePower: z.number().min(0).max(100).nullable(),
    description: nullableText,
    location: nullableText,
    notes: nullableText,
    lastModified: z.string().datetime(),
  })
  .superRefine((port, ctx) => {
    if (new Set(port.taggedVlans).size !== port.taggedVlans.length)
      ctx.addIssue({
        code: "custom",
        message: "Tagged VLANs must be unique",
        path: ["taggedVlans"],
      });
    if (!port.poeEnabled && port.poePower !== null)
      ctx.addIssue({
        code: "custom",
        message: "PoE power cannot be set while PoE is disabled",
        path: ["poePower"],
      });
  });

export const deviceSchema = z.object({
  id: z.string(),
  portId: z.string(),
  name: text.min(1),
  hostname: nullableText,
  ipAddress: optionalIpAddress,
  macAddress: optionalMacAddress,
  type: z.enum(deviceTypes),
  switchId: z.string(),
  vlanId: z.number().nullable(),
  location: nullableText,
  notes: nullableText,
});

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  defaultSwitchId: z.string().nullable(),
  compactMode: z.boolean(),
  showPortLabels: z.boolean(),
});

const workspaceEntityShape = {
  schemaVersion: z.literal(1),
  exportedAt: z.string().datetime(),
  switches: z.array(switchSchema),
  ports: z.array(portSchema),
  vlans: z.array(vlanSchema),
  settings: settingsSchema,
};

type WorkspaceRelations = {
  switches: Array<z.infer<typeof switchSchema>>;
  ports: Array<z.infer<typeof portSchema>>;
  vlans: Array<z.infer<typeof vlanSchema>>;
  settings: z.infer<typeof settingsSchema>;
};

export type PortVlanReference = {
  field: "vlanId" | "nativeVlan" | "taggedVlans";
  label: "access" | "native" | "tagged";
  id: number;
};

export function getMissingPortVlanReferences(
  port: Pick<
    z.infer<typeof portSchema>,
    "vlanId" | "nativeVlan" | "taggedVlans"
  >,
  vlanIds: ReadonlySet<number>,
): PortVlanReference[] {
  const references: PortVlanReference[] = [];
  if (port.vlanId !== null)
    references.push({ field: "vlanId", label: "access", id: port.vlanId });
  if (port.nativeVlan !== null)
    references.push({
      field: "nativeVlan",
      label: "native",
      id: port.nativeVlan,
    });
  references.push(
    ...port.taggedVlans.map((id) => ({
      field: "taggedVlans" as const,
      label: "tagged" as const,
      id,
    })),
  );
  return references.filter((reference) => !vlanIds.has(reference.id));
}

function validateWorkspaceRelations(
  data: WorkspaceRelations,
  ctx: z.RefinementCtx,
) {
  const switches = new Map(data.switches.map((item) => [item.id, item]));
  const vlanIds = new Set(data.vlans.map((item) => item.id));
  const switchIds = new Set<string>();
  const portIds = new Set<string>();
  const portNumbers = new Set<string>();

  data.switches.forEach((networkSwitch, index) => {
    if (switchIds.has(networkSwitch.id))
      ctx.addIssue({
        code: "custom",
        message: `Duplicate switch ID “${networkSwitch.id}”`,
        path: ["switches", index, "id"],
      });
    switchIds.add(networkSwitch.id);
    if (
      networkSwitch.managementVlan !== null &&
      !vlanIds.has(networkSwitch.managementVlan)
    )
      ctx.addIssue({
        code: "custom",
        message: `Switch ${networkSwitch.name} references missing management VLAN ${networkSwitch.managementVlan}`,
        path: ["switches", index, "managementVlan"],
      });
  });

  if (vlanIds.size !== data.vlans.length)
    ctx.addIssue({
      code: "custom",
      message: "VLAN IDs must be unique",
      path: ["vlans"],
    });

  data.ports.forEach((port, index) => {
    const networkSwitch = switches.get(port.switchId);
    const portLabel = networkSwitch
      ? `Port ${port.number} on ${networkSwitch.name}`
      : `Port ${port.number}`;
    if (portIds.has(port.id))
      ctx.addIssue({
        code: "custom",
        message: `Duplicate port ID “${port.id}”`,
        path: ["ports", index, "id"],
      });
    portIds.add(port.id);

    if (!networkSwitch)
      ctx.addIssue({
        code: "custom",
        message: `${portLabel} references unknown switch “${port.switchId}”`,
        path: ["ports", index, "switchId"],
      });
    else if (port.number > networkSwitch.portCount)
      ctx.addIssue({
        code: "custom",
        message: `${portLabel} exceeds the switch port count of ${networkSwitch.portCount}`,
        path: ["ports", index, "number"],
      });

    const numberKey = `${port.switchId}:${port.number}`;
    if (portNumbers.has(numberKey))
      ctx.addIssue({
        code: "custom",
        message: `Duplicate port ${port.number} on ${networkSwitch?.name ?? port.switchId}`,
        path: ["ports", index, "number"],
      });
    portNumbers.add(numberKey);

    getMissingPortVlanReferences(port, vlanIds).forEach((reference) => {
      ctx.addIssue({
        code: "custom",
        message: `${portLabel} references missing ${reference.label} VLAN ${reference.id}`,
        path: ["ports", index, reference.field],
      });
    });
  });

  if (
    data.settings.defaultSwitchId !== null &&
    !switches.has(data.settings.defaultSwitchId)
  )
    ctx.addIssue({
      code: "custom",
      message: "The default switch no longer exists",
      path: ["settings", "defaultSwitchId"],
    });
}

export const workspaceSchema = z
  .object({
    ...workspaceEntityShape,
    devices: z.array(deviceSchema),
  })
  .superRefine(validateWorkspaceRelations);

export const workspaceImportSchema = z
  .object({
    ...workspaceEntityShape,
    devices: z.array(z.unknown()).optional().default([]),
  })
  .superRefine(validateWorkspaceRelations);

export type NetworkSwitch = z.infer<typeof switchSchema>;
export type Port = z.infer<typeof portSchema>;
export type Vlan = z.infer<typeof vlanSchema>;
export type Device = z.infer<typeof deviceSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type PortStatus = (typeof portStatuses)[number];
export type PortType = (typeof portTypes)[number];
