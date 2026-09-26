# Port Map

**Visual switch port management for network teams.**

Port Map is a local-first application for documenting network switches, physical ports, VLAN assignments, PoE endpoints, and connected devices. It gives IT technicians, system administrators, and NOC teams a compact operational view without requiring a server or account.

> All data stays in the browser. No account or external database is required.

## Features

- Realistic 8, 16, 24, 48, and custom-count switch port layouts
- Fast in-place port editing for VLANs, endpoint details, speed, duplex, PoE, and notes
- Multi-port selection and bulk VLAN, type, state, location, note, and clear operations
- Search across ports, addresses, devices, VLANs, and descriptions with instant filters
- Switch and VLAN inventory with validated VLAN IDs
- Device inventory derived automatically from documented port connections
- Versioned, Zod-validated JSON import and export
- Browser-local IndexedDB persistence, manual backups, and guarded restore
- Light, dark, and system themes; responsive navigation and horizontally scrollable hardware panels
- Keyboard-accessible controls and status cues that do not rely on color alone

## Screenshots

Screenshots will be added with the first tagged release. Run the application locally to explore the included three-switch demo workspace in either light or dark theme.

## Technology

- Next.js 16 App Router and React 19
- Strict TypeScript
- Tailwind CSS 4 plus a compact, token-based design system
- Lucide icons
- IndexedDB through `idb`
- Zod runtime validation
- Vitest, Testing Library, and Playwright

## Installation

Requirements: Node.js 20.9 or newer and pnpm 10.

```bash
git clone https://github.com/your-org/port-map.git
cd port-map
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The demo workspace is created on the first visit.

## Development

```bash
pnpm dev        # start the development server
pnpm lint       # run ESLint
pnpm typecheck  # run TypeScript without emitting files
pnpm test       # run unit and component tests
pnpm test:e2e   # run the Playwright smoke test
pnpm build      # create a production build
pnpm start      # serve the production build
```

Install the Playwright browser once before the first end-to-end run:

```bash
pnpm exec playwright install chromium
```

## Project structure

```text
src/
├── app/          App Router pages and global styles
├── components/   Shared application shell and UI primitives
├── data/         IndexedDB repository implementation
├── domain/       Zod schemas, types, and seed workspace
├── features/     Feature-level state and editors
├── services/     Pure workspace operations and import/export logic
└── test/         Test environment setup
e2e/              Playwright smoke tests
```

The browser stores one current workspace and independent backup snapshots. UI components mutate data through the workspace service/provider; they never access IndexedDB directly. Device records are rebuilt from connected-device port fields after port changes, keeping the two views consistent.

## Data and privacy

Port Map makes no application-level network requests and has no telemetry, user accounts, or server-side storage. Workspace data and backups live in the browser's IndexedDB database for the current site origin. Clearing site data removes them. JSON exports are unencrypted documents; handle them according to your organization's network documentation policy.

Imported files must match the current versioned schema. Port Map validates entity fields and references before presenting the replacement confirmation, then creates a backup of the existing workspace.

## Roadmap

- **v0.1** — Local switch, VLAN, device, and port management
- **v0.2** — CSV import/export, reusable port templates, improved search
- **v0.3** — Read-only SNMP discovery
- **v0.4** — Topology visualization
- **v1.0** — Stable export schema and formal migration support

SNMP discovery and topology mapping are roadmap items and are not implemented today.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before starting a change and report security issues according to [SECURITY.md](SECURITY.md).

Useful GitHub topics: `networking`, `network-tools`, `network-management`, `netops`, `switch`, `vlan`, `network-administration`, `nextjs`, `typescript`, `open-source`.

## License

[MIT](LICENSE) © Port Map contributors.
