import { z } from "zod";

const ipAddressSchema = z.union([z.ipv4(), z.ipv6()]);
const macAddressPattern =
  /^[0-9a-fA-F]{2}([:-])(?:[0-9a-fA-F]{2}\1){4}[0-9a-fA-F]{2}$/;

export function isValidIpAddress(value: string): boolean {
  return ipAddressSchema.safeParse(value.trim()).success;
}

export function isValidMacAddress(value: string): boolean {
  return macAddressPattern.test(value.trim());
}

export function normalizeMacAddress(value: string): string {
  const trimmed = value.trim();
  if (!isValidMacAddress(trimmed)) throw new Error("Invalid MAC address");
  return trimmed.replaceAll("-", ":").toUpperCase();
}
