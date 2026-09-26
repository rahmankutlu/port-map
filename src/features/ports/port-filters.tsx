"use client";

import { Search, X } from "lucide-react";
import { Panel } from "@/components/page";
import { Button, Input, Select } from "@/components/ui";
import { portStatuses, portTypes, speeds, type Vlan } from "@/domain/models";
import type { PortFilterController } from "./use-port-filters";

export function PortFilters({
  filters,
  vlans,
}: {
  filters: PortFilterController;
  vlans: Vlan[];
}) {
  return (
    <Panel className="filter-panel">
      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <Input
            aria-label="Search ports"
            placeholder="Search port, IP, MAC, device, VLAN…"
            value={filters.query}
            onChange={(event) => filters.setQuery(event.target.value)}
          />
        </div>
        <Select
          aria-label="Filter status"
          value={filters.status}
          onChange={(event) => filters.setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          {portStatuses.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
        <Select
          aria-label="Filter port type"
          value={filters.type}
          onChange={(event) => filters.setType(event.target.value)}
        >
          <option value="">All types</option>
          {portTypes.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
        <Select
          aria-label="Filter VLAN"
          value={filters.vlan}
          onChange={(event) => filters.setVlan(event.target.value)}
        >
          <option value="">All VLANs</option>
          {vlans.map((item) => (
            <option value={item.id} key={item.id}>
              {item.id} · {item.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter PoE"
          value={filters.poe}
          onChange={(event) => filters.setPoe(event.target.value)}
        >
          <option value="">Any PoE</option>
          <option value="yes">PoE enabled</option>
          <option value="no">No PoE</option>
        </Select>
        <Select
          aria-label="Filter speed"
          value={filters.speed}
          onChange={(event) => filters.setSpeed(event.target.value)}
        >
          <option value="">Any speed</option>
          {speeds.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
        {filters.hasFilters && (
          <Button
            variant="ghost"
            aria-label="Clear filters"
            onClick={filters.clearFilters}
          >
            <X size={16} />
          </Button>
        )}
      </div>
    </Panel>
  );
}
