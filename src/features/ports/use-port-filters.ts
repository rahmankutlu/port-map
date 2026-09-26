"use client";

import { useMemo, useState } from "react";
import type { Port } from "@/domain/models";

export function usePortFilters(ports: Port[], switchId: string) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [vlan, setVlan] = useState("");
  const [poe, setPoe] = useState("");
  const [speed, setSpeed] = useState("");
  const filtered = useMemo(
    () =>
      ports
        .filter((port) => port.switchId === switchId)
        .filter((port) => {
          const haystack = [
            port.number,
            port.name,
            port.ipAddress,
            port.macAddress,
            port.connectedDevice,
            port.description,
            port.vlanId,
          ]
            .join(" ")
            .toLowerCase();
          return (
            (!query || haystack.includes(query.toLowerCase())) &&
            (!status || port.status === status) &&
            (!type || port.type === type) &&
            (!vlan ||
              port.vlanId === Number(vlan) ||
              port.taggedVlans.includes(Number(vlan))) &&
            (!poe || (poe === "yes") === port.poeEnabled) &&
            (!speed || port.speed === speed)
          );
        }),
    [ports, switchId, query, status, type, vlan, poe, speed],
  );
  const hasFilters = Boolean(query || status || type || vlan || poe || speed);
  const clearFilters = () => {
    setQuery("");
    setStatus("");
    setType("");
    setVlan("");
    setPoe("");
    setSpeed("");
  };
  return {
    query,
    setQuery,
    status,
    setStatus,
    type,
    setType,
    vlan,
    setVlan,
    poe,
    setPoe,
    speed,
    setSpeed,
    filtered,
    hasFilters,
    clearFilters,
  };
}

export type PortFilterController = ReturnType<typeof usePortFilters>;
