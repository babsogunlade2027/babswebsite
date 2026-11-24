# BABS CMS — UX and Workflow Contract

## Product scope

A role-aware editorial and administration console for the BABS Ogunlade public website. The current public site is static and GitHub-backed; the existing Decap CMS is an initial content editor, not a complete administrative system. Any capability shown as available must be connected to its real persistence layer.

## Canonical ownership

| Capability | Canonical owner | Source of truth | Required verification |
|---|---|---|---|
| Public content | Existing HTML, JSON and approved media in GitHub until migration | Git repository | Public page reflects published content |
| Editorial workflow | CMS service and persisted content status | CMS backend | Draft, review, publish and archive lifecycle |
| Authentication | Server-validated identity/session | Identity provider | Expiry, logout, invalid session |
| Authorization | Server-side role/permission policy | Database policy | Direct API denial for insufficient role |
| Media | Validated object-storage service | Storage metadata + object | Type/size checks, preview, delete safety |
| Enquiries | Server-side enquiry service | Database | Submission, read/unread, archive, export |
| Navigation | Managed navigation record | Database or committed config | Public header/footer update |
| Feedback | Shared notification layer | Application UI | Accessible live region and recovery |
| Forms | Shared validation and field patterns | Application UI | Inline errors, retained values, duplicate-submit prevention |
| Tables | Shared paginated table pattern | Application UI | Search, sort, paging, empty/error states |

## Roles

Target roles are Super Administrator, Administrator, Editor, Author, Media Manager and Viewer. The backend must enforce permissions independently of UI visibility. The current GitHub OAuth integration does not implement these six roles; do not represent it as role-based access control.

## Content lifecycle

Allowed editorial states: draft, in_review, scheduled, published, archived. Only published records are publicly retrievable. Scheduling must be server-side and timezone-aware; do not rely on a browser remaining open. Unpublishing hides public content without deleting the record.

## Editorial integrity

- Proposed priorities and manifesto commitments must remain explicitly proposed.
- Verify names, dates, places, quotations, titles and numerical claims.
- Preserve approved biography and campaign information.
- Keep author, reviewer, approver and timestamps in the audit trail.
- Never seed production with sample articles, fake analytics or placeholder user accounts.

## Interaction contract

Every mutation follows: user intent → permission check → validation → pending state → persistence → success feedback and stable destination. On failure, preserve user input and show an actionable error. Prevent duplicate submissions. Confirm destructive, irreversible and permission-changing actions with an object-specific confirmation. Use semantic buttons and links, visible focus, keyboard operation and WCAG 2.2 AA as the target.

## Data and privacy

Enquiry records contain personal information. Restrict access by role, avoid logging message bodies and credentials, apply retention/deletion policy, and do not export data to public or unauthorised destinations. Passwords and OAuth secrets never enter browser storage, repository files or logs.

## Release gates

1. No production DNS or domain route changes without explicit verification and rollback plan.
2. No public deployment until authentication, server-side authorization, data persistence, public rendering and error paths pass tests.
3. A successful static build is not evidence of a secure or functional CMS.
4. Document any capability that remains unavailable or depends on external configuration.
