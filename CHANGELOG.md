# Changelog

All notable changes to Port Map are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project intends to use semantic versioning after 1.0.

## [Unreleased]

### Changed

- Reworked navigation and the dashboard into a calmer, inventory-first interface with clearer hierarchy
- Replaced the dense metric grid with a contextual workspace summary, switch utilization list, review queue, and recent-change table
- Refined cards, tables, filters, forms, dialogs, dark mode, and responsive layouts with a cohesive product visual system

## [0.1.1] - 2026-09-26

Validation and reliability hardening.

### Added

- GitHub Pages live demo deployment and application discovery metadata
- Sitemap, robots policy, web manifest, Open Graph, and structured data
- Automated dependency updates, CodeQL scanning, and repository ownership rules
- Playwright browser smoke tests as a separate CI job

### Changed

- Strengthened network address and relational workspace validation
- Rebuilt derived device records from authoritative port data during import
- Normalized accepted MAC addresses to uppercase colon notation
- Split the Port Map page into focused filtering, chassis, directory, and bulk-edit modules

### Fixed

- Replaced live-status wording with truthful documentation-state language
- Added contextual import errors for invalid references and network addresses
- Preserved switch management VLAN references when VLANs are edited or removed

## [0.1.0] - 2026-09-26

### Added

- Local-first switch, port, VLAN, and derived device inventory
- Physical switch panel with accessible status indicators
- Port search, filters, detail editing, and bulk operations
- Versioned JSON import/export with validation and automatic backups
- Manual backup restore, theme preferences, demo reset, and local-data deletion
- Automated lint, type, unit, build, and end-to-end checks

[Unreleased]: https://github.com/rahmankutlu/port-map/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/rahmankutlu/port-map/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/rahmankutlu/port-map/releases/tag/v0.1.0
