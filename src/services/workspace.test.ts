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
  it("rejects malformed and unsupported imports", () => {
    expect(() => parseWorkspaceJson("not json")).toThrow("not valid JSON");
    expect(() =>
      parseWorkspaceJson(JSON.stringify({ schemaVersion: 99 })),
    ).toThrow();
  });
});
