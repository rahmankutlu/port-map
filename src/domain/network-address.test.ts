import { describe, expect, it } from "vitest";
import {
  isValidIpAddress,
  isValidMacAddress,
  normalizeMacAddress,
} from "./network-address";

describe("network address helpers", () => {
  it.each([
    "192.168.1.1",
    "10.0.0.254",
    "2001:db8::1",
    "::1",
    "fe80::1234:abcd",
  ])("accepts valid IP address %s", (address) => {
    expect(isValidIpAddress(address)).toBe(true);
  });

  it.each(["192.168.1.999", "192.168.1", "2001:db8:::1", "not-an-address"])(
    "rejects malformed IP address %s",
    (address) => {
      expect(isValidIpAddress(address)).toBe(false);
    },
  );

  it.each(["00:1a:2b:3c:4d:5e", "00-1A-2B-3C-4D-5E"])(
    "accepts common MAC address %s",
    (address) => expect(isValidMacAddress(address)).toBe(true),
  );

  it("normalizes MAC addresses to uppercase colon notation", () => {
    expect(normalizeMacAddress("00-1a-2b-3c-4d-5e")).toBe("00:1A:2B:3C:4D:5E");
  });

  it.each(["001A.2B3C.4D5E", "00:1A:2B:3C:4D", "GG:1A:2B:3C:4D:5E"])(
    "rejects unsupported or malformed MAC address %s",
    (address) => expect(isValidMacAddress(address)).toBe(false),
  );
});
