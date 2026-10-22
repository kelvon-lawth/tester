# Phase 3: Kinetic Hero - Context

**Gathered:** 2026-10-22
**Status:** Implemented ahead of phase (quick task 261013-ffc)

<domain>
## Phase Boundary

The hero's cycling "Marketing for your [word]" headline (HERO-01..06). The user asked for it early as quick task 261013-ffc (commits 5b9c3ff, 2333186, 3040c86, verified with no gaps). Phase 2 review fixes later touched the hero entrance (WR-04, 5e9a648) and the motion lifecycle (WR-01, 0b62a3d).
</domain>

<decisions>
## Implementation Decisions
- GSAP 3.15.0 with SplitText, per-letter motion, 7 words. This replaces the roadmap research flag's "CSS-first, word-level" default, because the user asked for a bold kinetic headline.
- No new build work. This phase only re-verifies HERO-01..06 against the current code and records the result.
</decisions>

<deferred>
## Deferred Ideas
- Real-device smoothness check, carried to Phase 5 QA.
</deferred>
