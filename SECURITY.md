# Security Policy

## Supported versions

Security fixes are applied to the latest release. Port Map is currently pre-1.0.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability reporting for this repository, including reproduction steps, impact, and affected versions. Maintainers will acknowledge a complete report within seven days.

Port Map stores network documentation locally in IndexedDB and exports it as unencrypted JSON. It is not a secrets manager: do not store passwords, API tokens, SNMP community strings, or device credentials in free-text fields.
