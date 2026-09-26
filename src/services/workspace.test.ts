import { describe, expect, it } from "vitest";
import { createDemoWorkspace } from "@/domain/seed";
import {
  bulkUpdatePorts,
  createSwitch,
  parseWorkspaceJson,
  serializeWorkspace,
  updatePort,
} from "./workspace";

describe("workspace operations", () => {
  it("creates a switch and exactly the requested number of ports", () => {
    const source = createDemoWorkspace();
    const next = createSwitch(
      {
        name: "LAB-SW-01",
        hostname: "lab-sw-01",
        managementIp: "10.10.0.50",
        vendor: "Juniper",
        model: "EX",
        serialNumber: "",
        location: "Lab",
        rack: "LAB-A",
        rackUnit: "U10",
        portCount: 8,
        managementVlan: 10,
        description: "",
      },
      source,
    );
    expect(next.switches).toHaveLength(source.switches.length + 1);
    const created = next.switches.at(-1)!;
    expect(
      next.ports.filter((port) => port.switchId === created.id),
    ).toHaveLength(8);
  });
  it("edits a port and rebuilds the derived device inventory", () => {
    const source = createDemoWorkspace();
    const port = source.ports[0];
    const next = updatePort(source, port.id, {
      connectedDevice: "NEW-SERVER",
      ipAddress: "10.20.1.5",
    });
    expect(next.ports[0].connectedDevice).toBe("NEW-SERVER");
    expect(next.devices.find((device) => device.portId === port.id)?.name).toBe(
      "NEW-SERVER",
    );
  });
  it("applies a bulk operation only to selected ports", () => {
    const source = createDemoWorkspace();
    const ids = source.ports.slice(0, 3).map((port) => port.id);
    const untouched = source.ports[3];
    const next = bulkUpdatePorts(source, ids, { vlanId: 60, type: "Access" });
    expect(next.ports.slice(0, 3).every((port) => port.vlanId === 60)).toBe(
      true,
    );
    expect(next.ports[3].vlanId).toBe(untouched.vlanId);
  });
  it("round-trips a versioned export", () => {
    const source = createDemoWorkspace();
    const restored = parseWorkspaceJson(serializeWorkspace(source));
    expect(restored.schemaVersion).toBe(1);
    expect(restored.switches).toHaveLength(3);
    expect(restored.ports).toHaveLength(96);
  });

  it("discards imported device records and rebuilds them from ports", () => {
    const source = createDemoWorkspace();
    const input = JSON.parse(serializeWorkspace(source)) as Record<
      string,
      unknown
    >;
    input.devices = [{ arbitrary: "untrusted" }];
    const restored = parseWorkspaceJson(JSON.stringify(input));
    expect(restored.devices).toEqual(source.devices);
    expect(restored.devices).toHaveLength(
      source.ports.filter((port) => port.connectedDevice).length,
    );
  });

  it("normalizes imported MAC addresses before rebuilding devices", () => {
    const source = createDemoWorkspace();
    source.ports[0].macAddress = "00-1a-2b-3c-4d-5e";
    const restored = parseWorkspaceJson(JSON.stringify(source));
    expect(restored.ports[0].macAddress).toBe("00:1A:2B:3C:4D:5E");
    expect(
      restored.devices.find((item) => item.portId === source.ports[0].id)
        ?.macAddress,
    ).toBe("00:1A:2B:3C:4D:5E");
  });

  it("reports invalid relations with human-readable context", () => {
    const source = createDemoWorkspace();
    source.ports[0].vlanId = 4094;
    expect(() => parseWorkspaceJson(JSON.stringify(source))).toThrow(
      "Port 1 on CORE-SW-01 references missing access VLAN 4094",
    );
  });

  it("reports invalid network addresses without exposing Zod paths", () => {
    const source = createDemoWorkspace();
    source.ports[0].macAddress = "not-a-mac";
    expect(() => parseWorkspaceJson(JSON.stringify(source))).toThrow(
      "Port 1 on CORE-SW-01: must be a MAC address",
    );
  });
  it("rejects malformed and unsupported imports", () => {
    expect(() => parseWorkspaceJson("not json")).toThrow("not valid JSON");
    expect(() =>
      parseWorkspaceJson(JSON.stringify({ schemaVersion: 99 })),
    ).toThrow();
  });
});
