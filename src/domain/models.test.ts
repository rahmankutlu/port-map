import { describe, expect, it } from "vitest";
import { createDemoWorkspace } from "./seed";
import {
  portSchema,
  switchSchema,
  vlanSchema,
  workspaceSchema,
} from "./models";

describe("VLAN validation", () => {
  it.each([1, 10, 4094])("accepts valid VLAN ID %i", (id) =>
    expect(
      vlanSchema.safeParse({
        id,
        name: "Network",
        description: "",
        color: "#112233",
      }).success,
    ).toBe(true),
  );
  it.each([0, 4095, 2.5])("rejects invalid VLAN ID %i", (id) =>
    expect(
      vlanSchema.safeParse({
        id,
        name: "Network",
        description: "",
        color: "#112233",
      }).success,
    ).toBe(false),
  );
  it("rejects missing names and invalid colors", () =>
    expect(
      vlanSchema.safeParse({ id: 20, name: "", description: "", color: "blue" })
        .success,
    ).toBe(false));
});

describe("network entity validation", () => {
  it.each(["10.10.0.1", "2001:db8::10"])(
    "accepts switch management address %s",
    (managementIp) => {
      const networkSwitch = createDemoWorkspace().switches[0];
      expect(
        switchSchema.safeParse({ ...networkSwitch, managementIp }).success,
      ).toBe(true);
    },
  );

  it("rejects invalid management addresses and port counts", () => {
    const networkSwitch = createDemoWorkspace().switches[0];
    expect(
      switchSchema.safeParse({
        ...networkSwitch,
        managementIp: "192.168.1.999",
      }).success,
    ).toBe(false);
    expect(
      switchSchema.safeParse({ ...networkSwitch, portCount: 0 }).success,
    ).toBe(false);
  });

  it("validates and normalizes port addresses", () => {
    const port = createDemoWorkspace().ports[0];
    const result = portSchema.safeParse({
      ...port,
      ipAddress: "2001:db8::42",
      macAddress: "00-1a-2b-3c-4d-5e",
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.data.macAddress).toBe("00:1A:2B:3C:4D:5E");
    expect(
      portSchema.safeParse({ ...port, ipAddress: "192.168.1.999" }).success,
    ).toBe(false);
    expect(
      portSchema.safeParse({ ...port, macAddress: "not-a-mac" }).success,
    ).toBe(false);
  });

  it("rejects duplicate tagged VLANs and inconsistent PoE data", () => {
    const port = createDemoWorkspace().ports[0];
    expect(
      portSchema.safeParse({ ...port, taggedVlans: [10, 10] }).success,
    ).toBe(false);
    expect(
      portSchema.safeParse({ ...port, poeEnabled: false, poePower: 4 }).success,
    ).toBe(false);
    expect(
      portSchema.safeParse({ ...port, poeEnabled: true, poePower: -1 }).success,
    ).toBe(false);
  });
});

describe("workspace relational integrity", () => {
  const rejects = (
    mutate: (workspace: ReturnType<typeof createDemoWorkspace>) => void,
  ) => {
    const workspace = structuredClone(createDemoWorkspace());
    mutate(workspace);
    expect(workspaceSchema.safeParse(workspace).success).toBe(false);
  };

  it("accepts the valid demo workspace", () => {
    expect(workspaceSchema.safeParse(createDemoWorkspace()).success).toBe(true);
  });

  it("rejects duplicate switch and port IDs", () => {
    rejects((workspace) =>
      workspace.switches.push({ ...workspace.switches[0] }),
    );
    rejects((workspace) => {
      workspace.ports[1].id = workspace.ports[0].id;
    });
  });

  it("rejects missing management VLANs and default switches", () => {
    rejects((workspace) => {
      workspace.switches[0].managementVlan = 4094;
    });
    rejects((workspace) => {
      workspace.settings.defaultSwitchId = "missing-switch";
    });
  });

  it("rejects unknown switches, duplicate port numbers, and out-of-range ports", () => {
    rejects((workspace) => {
      workspace.ports[0].switchId = "missing-switch";
    });
    rejects((workspace) => {
      workspace.ports[1].number = workspace.ports[0].number;
    });
    rejects((workspace) => {
      workspace.ports[0].number = workspace.switches[0].portCount + 1;
    });
  });

  it.each([
    [
      "access",
      (workspace: ReturnType<typeof createDemoWorkspace>) => {
        workspace.ports[0].vlanId = 4094;
      },
    ],
    [
      "native",
      (workspace: ReturnType<typeof createDemoWorkspace>) => {
        workspace.ports[0].nativeVlan = 4094;
      },
    ],
    [
      "tagged",
      (workspace: ReturnType<typeof createDemoWorkspace>) => {
        workspace.ports[0].taggedVlans = [4094];
      },
    ],
  ])("rejects a missing %s VLAN", (_label, mutate) => rejects(mutate));
});
