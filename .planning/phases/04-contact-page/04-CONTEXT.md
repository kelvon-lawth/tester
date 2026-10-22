# Phase 4: Contact Page - Context

**Gathered:** 2026-10-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Contact page: a validated front-end-only form, an honest success state, direct details and an area-served graphic.
Quick task 261013-eil (with ep2 restyle and Phase 2 review fixes CR-01/WR-03/IN-08) already built the form, validation, success state and details aside.
</domain>

<decisions>
## Implementation Decisions

### Locked (user decision D-01, 2026-10-13)
- The form fields are name (required), phone (required), email (required) and message (optional). This supersedes the CON-01 field list.
- CON-02 (business-type picker) and CON-03 (services checkboxes) are DROPPED. Do not re-add them. Mark them as descoped by D-01 in REQUIREMENTS.md.

### Remaining work: CON-07, the area-served graphic
- Inline SVG, no image file and no map library, so it works over file://.
- It is a stylised, hand-feel local map: Elmhollow in the centre, with Fenwick Cross and Thornby as nearby labelled pins. Add soft roads or a river line, dashed coral "service radius" ring(s), and a navy/blue/coral palette using the existing tokens only. Respect the check-design-system blue allow-list.
- Place it in or under the contact details aside, near the existing "Area served" label. The SVG gets role="img" plus a <title>/aria-label naming the three places, and its text is real <text> or visible HTML so it stays readable.
- It must not cause horizontal scroll at 320px. It scales fluidly.
- Optional motion: a gentle draw-in of the ring/route with transform/opacity or stroke-dashoffset, following the existing pattern. The reduced-motion and no-JS states show the graphic fully drawn.
- Add the place names and graphic to REPLACE-ME.md.

### Re-verify existing CON-01 (as amended), CON-04, CON-05 and CON-06 with the guards.

### Claude's Discretion
Exact map shapes, label placement, and animation details.
</decisions>

<deferred>
## Deferred Ideas
- A real map embed. It is not wanted at the static prototype stage.
</deferred>
