---
version: alpha
colors:
  campaign-green:
    value: "#008751"
    role: "Primary campaign identity and positive action"
  navy:
    value: "#0A2540"
    role: "Institutional navigation, headings and high-contrast surfaces"
  gold:
    value: "#D4AF37"
    role: "Restrained emphasis and campaign signature"
  canvas:
    value: "#F8FAFC"
    role: "Administrative page background"
  ink:
    value: "#243244"
    role: "Primary text"
  muted:
    value: "#64748B"
    role: "Secondary text and metadata"
  surface:
    value: "#FFFFFF"
    role: "Cards, forms and content surfaces"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
  sans:
    fontFamily: "Inter, 'Segoe UI', Arial, sans-serif"
  utility:
    fontFamily: "'SFMono-Regular', Consolas, monospace"
rounded:
  small: "8px"
  medium: "12px"
  large: "18px"
spacing:
  unit: "4px"
components:
  button:
    radius: "999px"
    minimumHeight: "44px"
  panel:
    radius: "18px"
    border: "1px solid #E2E8F0"
omitted:
  - section: elevation
    reason: "Use only subtle elevation where it clarifies layered admin surfaces; avoid decorative shadow stacks."
---
## Overview

The administrative experience is the publishing desk of a constituency-facing public information platform. Its users are campaign communications and administrative staff working across phones, tablets and desktop computers in Nigeria. The interface should feel like a well-run editorial office: calm, accountable, legible and fast under deadline pressure.

The public website's current implementation is a static HTML/CSS/JavaScript site. Its established palette is deep green, navy and gold, with Montserrat on the homepage and a separate stylesheet system on interior pages. The admin palette above records the approved project brief's target colours; public-site tokens must not be silently rebranded as part of admin work.

## Colors

Use campaign green for the primary action, navy for the institutional frame, and gold sparingly for meaningful emphasis. White surfaces and a cool, pale canvas keep long editing sessions readable. Status must never be conveyed by colour alone.

## Typography

Use a restrained editorial serif only for occasional page-level statements. Use a highly legible sans family for all controls, tables and body text. Use tabular numerals for dates, counts and IDs. Avoid loading large display typography for utility screens.

## Layout

The admin shell uses a persistent desktop navigation rail, a compact top bar, and a single main work column. On phones, the rail becomes a keyboard-accessible drawer and tables become stacked records or horizontally scrollable data regions with clear affordances. Keep editing forms in natural document flow; never trap the whole application in a fixed-height viewport.

## Elevation & Depth

Use borders and surface contrast as the primary grouping devices. Reserve shadows for overlays and the navigation drawer. Avoid glossy gradients, glass effects and decorative dashboard charts.

## Shapes

Use modest radii for cards and fields. Pill treatment is reserved for primary campaign actions, not every control. Destructive actions remain visually distinct.

## Components

Buttons need hover, pressed, disabled, busy and keyboard-focus states. Tables need explicit loading, empty, no-results and error states. Forms use persistent labels, inline errors and retained values after recoverable failure. Toasts acknowledge completed actions but never replace important inline feedback.

## Do's and Don'ts

- Do keep the BABS campaign identity and approved wording intact.
- Do distinguish proposed policy commitments from completed achievements.
- Do display real counts only when they come from the actual content source.
- Do use British English and clear, task-focused action labels.
- Don't invent biography details, endorsements, metrics or project delivery claims.
- Don't turn the CMS into a campaign analytics dashboard with fabricated data.
- Don't change public site branding as a side effect of admin styling.
