import { z } from "zod";

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
  managementIp: nullableText,
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

export const portSchema = z.object({
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
  macAddress: nullableText,
  ipAddress: nullableText,
  speed: z.enum(speeds),
  duplex: z.enum(["Full", "Half", "Auto"]),
  poeEnabled: z.boolean(),
  poePower: z.number().min(0).max(100).nullable(),
  description: nullableText,
  location: nullableText,
  notes: nullableText,
  lastModified: z.string().datetime(),
});

export const deviceSchema = z.object({
  id: z.string(),
  portId: z.string(),
  name: text.min(1),
  hostname: nullableText,
  ipAddress: nullableText,
  macAddress: nullableText,
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

export const workspaceSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: z.string().datetime(),
    switches: z.array(switchSchema),
    ports: z.array(portSchema),
    vlans: z.array(vlanSchema),
    devices: z.array(deviceSchema),
    settings: settingsSchema,
  })
  .superRefine((data, ctx) => {
    const switchIds = new Set(data.switches.map((item) => item.id));
    const vlanIds = new Set(data.vlans.map((item) => item.id));
    if (switchIds.size !== data.switches.length)
      ctx.addIssue({
        code: "custom",
        message: "Switch IDs must be unique",
        path: ["switches"],
      });
    if (vlanIds.size !== data.vlans.length)
      ctx.addIssue({
        code: "custom",
        message: "VLAN IDs must be unique",
        path: ["vlans"],
      });
    data.ports.forEach((port, index) => {
      if (!switchIds.has(port.switchId))
        ctx.addIssue({
          code: "custom",
          message: "Port references an unknown switch",
          path: ["ports", index, "switchId"],
        });
      if (port.vlanId && !vlanIds.has(port.vlanId))
        ctx.addIssue({
          code: "custom",
          message: "Port references an unknown VLAN",
          path: ["ports", index, "vlanId"],
        });
    });
  });

export type NetworkSwitch = z.infer<typeof switchSchema>;
export type Port = z.infer<typeof portSchema>;
export type Vlan = z.infer<typeof vlanSchema>;
export type Device = z.infer<typeof deviceSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type PortStatus = (typeof portStatuses)[number];
export type PortType = (typeof portTypes)[number];
