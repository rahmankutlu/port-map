import type { Device, NetworkSwitch, Port, Workspace } from "./models";

const now = "2026-09-25T12:00:00.000Z";
const switchData: Array<Omit<NetworkSwitch, "createdAt" | "updatedAt">> = [
  {
    id: "sw-core-01",
    name: "CORE-SW-01",
    hostname: "core-sw-01",
    managementIp: "10.10.0.11",
    vendor: "Cisco",
    model: "Catalyst 9300-48P",
    serialNumber: "FOC2401A1N7",
    location: "Main office",
    rack: "MDF-A",
    rackUnit: "U32",
    portCount: 48,
    managementVlan: 10,
    description: "Core distribution and server access",
  },
  {
    id: "sw-access-01",
    name: "ACCESS-SW-01",
    hostname: "access-sw-01",
    managementIp: "10.10.0.21",
    vendor: "Aruba",
    model: "6200F 24G PoE",
    serialNumber: "CN92KJ40Q8",
    location: "Floor 1",
    rack: "IDF-1A",
    rackUnit: "U18",
    portCount: 24,
    managementVlan: 10,
    description: "Floor 1 user and voice access",
  },
  {
    id: "sw-access-02",
    name: "ACCESS-SW-02",
    hostname: "access-sw-02",
    managementIp: "10.10.0.22",
    vendor: "Ubiquiti",
    model: "USW-Pro-24-PoE",
    serialNumber: "74ACB94218E1",
    location: "Floor 2",
    rack: "IDF-2A",
    rackUnit: "U20",
    portCount: 24,
    managementVlan: 10,
    description: "Floor 2 access and cameras",
  },
];

function makePorts(sw: (typeof switchData)[number]): Port[] {
  return Array.from({ length: sw.portCount }, (_, index) => {
    const number = index + 1;
    const connected = number <= Math.round(sw.portCount * 0.62);
    const uplink = number > sw.portCount - 2;
    const warning = number === 7;
    const vlanId = uplink
      ? null
      : number % 9 === 0
        ? 40
        : number % 7 === 0
          ? 50
          : number % 5 === 0
            ? 30
            : 20;
    const deviceType =
      number % 9 === 0
        ? "IP Phone"
        : number % 7 === 0
          ? "Camera"
          : number % 6 === 0
            ? "Access Point"
            : "Workstation";
    return {
      id: `${sw.id}-p${number}`,
      switchId: sw.id,
      number,
      name: uplink
        ? `Uplink ${number}`
        : connected
          ? `Desk ${String(number).padStart(2, "0")}`
          : "",
      status: warning
        ? "Warning"
        : connected || uplink
          ? "Connected"
          : "Disconnected",
      type: uplink ? "Uplink" : connected ? "Access" : "Unused",
      vlanId,
      nativeVlan: uplink ? 10 : null,
      taggedVlans: uplink ? [10, 20, 30, 40, 50, 60] : [],
      connectedDevice: uplink
        ? sw.id === "sw-core-01"
          ? `ACCESS-SW-0${(number % 2) + 1}`
          : "CORE-SW-01"
        : connected
          ? `${deviceType.replace(" ", "-").toUpperCase()}-${String(number).padStart(2, "0")}`
          : "",
      deviceType: uplink ? "Switch" : deviceType,
      macAddress: connected
        ? `02:4A:6B:${number.toString(16).padStart(2, "0")}:1C:9E`.toUpperCase()
        : "",
      ipAddress: connected
        ? `10.${vlanId ?? 10}.${sw.id === "sw-core-01" ? 1 : 2}.${100 + number}`
        : "",
      speed: uplink ? "10 Gbps" : connected ? "1 Gbps" : "1 Gbps",
      duplex: "Full",
      poeEnabled:
        connected &&
        !uplink &&
        ["IP Phone", "Camera", "Access Point"].includes(deviceType),
      poePower:
        connected &&
        !uplink &&
        ["IP Phone", "Camera", "Access Point"].includes(deviceType)
          ? 8 + (number % 8)
          : null,
      description: warning ? "Intermittent link detected" : "",
      location: sw.location,
      notes: "",
      lastModified: new Date(Date.parse(now) - number * 3600000).toISOString(),
    } as Port;
  });
}

export function devicesFromPorts(ports: Port[]): Device[] {
  return ports
    .filter((port) => port.connectedDevice)
    .map((port) => ({
      id: `device-${port.id}`,
      portId: port.id,
      name: port.connectedDevice,
      hostname: port.connectedDevice.toLowerCase(),
      ipAddress: port.ipAddress,
      macAddress: port.macAddress,
      type: port.deviceType,
      switchId: port.switchId,
      vlanId: port.vlanId,
      location: port.location,
      notes: port.notes,
    }));
}

export function createDemoWorkspace(): Workspace {
  const switches = switchData.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
  }));
  const ports = switches.flatMap(makePorts);
  return {
    schemaVersion: 1,
    exportedAt: now,
    switches,
    ports,
    devices: devicesFromPorts(ports),
    vlans: [
      {
        id: 10,
        name: "Management",
        description: "Network infrastructure management",
        color: "#0ea5e9",
      },
      {
        id: 20,
        name: "Staff",
        description: "Employee workstations",
        color: "#22c55e",
      },
      {
        id: 30,
        name: "Guest",
        description: "Isolated guest access",
        color: "#a855f7",
      },
      { id: 40, name: "Voice", description: "IP telephony", color: "#f59e0b" },
      {
        id: 50,
        name: "CCTV",
        description: "Security cameras",
        color: "#ef4444",
      },
      {
        id: 60,
        name: "IPTV",
        description: "Digital signage and video",
        color: "#6366f1",
      },
    ],
    settings: {
      theme: "system",
      defaultSwitchId: "sw-core-01",
      compactMode: false,
      showPortLabels: true,
    },
  };
}
