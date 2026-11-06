# Tree Shop Constitution

Source of truth for requirements: `spec.md` (repo root). This constitution governs *how* we build;
the spec governs *what* we build. Where they conflict on a rule below, this constitution wins until
amended.

## Core Principles

### I. Money Is Integer Satang, One Calculation Function
- All monetary values MUST be stored, computed, and transmitted as integer satang (สตางค์).
  Floating-point money is forbidden. The UI converts to baht only at display time.
- Price, VAT, shipping, and total MUST be computed by a single pure function (in `src/rules/`,
  no DB access) shared by client display and the server quote (`/api/cart/quote`). VAT is rounded once, on the total
  (spec §4), never per line.
- That function MUST have unit tests covering spec §4 examples (e.g. ฿890 → ฿60 shipping, ฿1,000 →
  free shipping; VAT = round(total × 7 / 107)).

Rationale: totals shown in the cart and returned by the quote API must match to the satang.

### II. The Server Decides
- The server MUST recompute price, VAT, shipping, and availability warnings on every cart quote;
  prices and totals sent by the client are never trusted.
- All input MUST be validated server-side (Zod schemas shared with the client). Unknown or invalid
  values return `400 VALIDATION_ERROR`.

Rationale: a tampered request must never produce a different price than the catalog says.

### III. Test Hooks Are Test-Only
- The product has no accounts, login, or personal data; every visitor is a guest. Any future feature
  that introduces identity MUST first amend this constitution.
- `/api/test/*` endpoints MUST be unusable (404) unless `TEST_MODE=1`.

Rationale: a test endpoint that can reset data must never be reachable in a real deployment.

### IV. Bilingual by Construction (th / en)
- No user-facing string MAY be hard-coded in components; all copy lives in `messages/th.json` and
  `messages/en.json` via `next-intl`, and both files MUST have identical keys.
- Every page lives under a `/th` or `/en` prefix; switching language keeps the user on the same
  page and preserves the cart.
- Product and category content (seed data) MUST be complete in both languages; seeding with either
  missing MUST fail. APIs return ISO 8601 times (+07:00) and satang regardless of locale. `error`
  codes and slugs are never translated.

Rationale: partial translation is a defect, caught cheapest at the schema and key level.

### V. Test-First on the Published Contract (NON-NEGOTIABLE)
- spec.md §13 is a contract: endpoint paths, response shapes, `error` codes, `data-testid` values,
  `TEST_MODE` endpoints (`/api/test/reset`, `/api/test/bug-mode`), and `BUG_MODE` behavior MUST NOT be renamed or reshaped. New endpoints and
  test ids MAY be added.
- For each user story: write the failing test (Vitest unit / property, Playwright e2e) first,
  confirm it fails, then implement. Business rules (pricing, VAT, shipping, feng shui matching) live as pure
  functions in `src/rules/` so they can be tested without a database.
- Tests compare `error` codes, never `message` text. Any time-dependent logic MUST read time through
  one `now()` function so tests can control it.
- `BUG_MODE` defaults to `0`; the app MUST be correct at `0`.

Rationale: external test plans depend on this contract staying stable.

### VI. Simplicity and Scope (YAGNI)
- Anything listed in spec §10 (login/accounts for customers or the seller, ordering, payment and
  order tracking, admin pages, tax invoices, coupons, reviews, weight-based shipping, AI feng shui,
  a third language) MUST NOT be built this round.
- New abstractions, libraries, or services require a one-line justification in the PR naming the
  user story that needs them. Prefer platform and already-installed features.
- Scope is bounded by the workshop: if a story is not P1/P2 in `specs/*/user-stories.html`, it
  does not block release.

Rationale: the project must ship within the workshop.

## Technology Constraints

- Stack: Next.js 16 (App Router, TypeScript), Prisma 7 with PostgreSQL 16, `next-intl`, Tailwind
  CSS with daisyUI. Validation and test tooling follow spec.md §8.
- The entire system MUST start with one command: `docker compose up -d --build` (web, db). `compose.yml` is the single runtime definition; DB host port is `5435`.
- Next.js 16 differs from older versions: consult `node_modules/next/dist/docs/` before using an
  API (see `web/AGENTS.md`).
- Security baseline (spec §9): validate every input on the server; never trust client prices.
- Performance baseline: home and list pages load within 2 s on 4G; responsive at 375 px.

## Development Workflow & Quality Gates

- Work proceeds in the milestone order of spec §11 (M1 → M4); each story is independently
  testable and demonstrable.
- Before merge: unit and property tests pass; relevant Playwright e2e pass against
  `docker compose` with `TEST_MODE=1`; lint and type-check pass; no hard-coded UI strings; message
  files have matching keys.
- A change that touches money, the cart quote, or the §13 contract MUST include a test that
  would fail without the change.
- Commits follow conventional style (e.g. `feat:`, `fix:`, `docs:`).

## Governance

- This constitution supersedes other practices. Spec Kit artifacts (spec, plan, tasks) MUST be
  checked against it; violations must be fixed or explicitly justified in the plan's complexity
  notes.
- **Amendments**: propose via pull request that edits this file, states the rationale, lists
  impacted specs/tests/templates, and updates the version line. Approval by the project owner is
  required. Changes to Principle V (the contract) also require notifying anyone consuming the §13
  contract.
- **Versioning** (semantic): MAJOR for removing or redefining a principle in a backward-incompatible
  way; MINOR for adding a principle or materially expanding guidance; PATCH for wording and
  clarifications.
- **Compliance review**: every PR reviewer MUST confirm compliance with Principles I–VI; the
  checklist is the Quality Gates above.

**Version**: 2.0.0 | **Ratified**: 2026-11-06 | **Last Amended**: 2026-11-06
