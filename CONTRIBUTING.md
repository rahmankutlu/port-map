# Contributing to Port Map

Thank you for helping improve Port Map. Keep changes focused, accessible, and useful to network operators.

## Workflow

1. Search existing issues and open one for substantial features.
2. Fork the repository and create a short-lived branch.
3. Install with `pnpm install` and develop with `pnpm dev`.
4. Add tests for changed business logic or user workflows.
5. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
6. Open a pull request using the template.

Use conventional-style commit subjects where practical, such as `feat: add CSV VLAN import` or `fix: retain tagged VLANs on edit`. Never include real network inventories, credentials, community strings, or identifiable customer data in issues or fixtures.

## Design principles

- Preserve the local-first, no-account architecture.
- Keep the interface compact, accessible, and useful without color alone.
- Validate every imported data source at the boundary.
- Keep domain and persistence logic outside React components.
- Avoid dependencies when a small maintainable implementation is sufficient.
