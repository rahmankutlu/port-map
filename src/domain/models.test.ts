import { describe, expect, it } from "vitest";
import { vlanSchema } from "./models";

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
