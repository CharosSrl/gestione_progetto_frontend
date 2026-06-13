# Project — gestione_progetto (frontend)

Angular frontend. Repo: https://github.com/CharosSrl/gestione_progetto_frontend

## Skills (auto-loaded every session)

This project keeps reusable skills in `skills/`. Each skill is a `.skill` bundle
(a zip) plus its extracted, plain-text form. The extracted `SKILL.md` files are
imported below so their guidance is in context from the start of every session.

When working in this project, follow the conventions defined by these skills.
Read a skill's `references/*.md` files only when the skill tells you to.

- **context-guardian** — apply at the start of and throughout **every** session:
  watch the context window and act at ~40% usage (compact/reset) to avoid
  context rot.
- **angular-project** — conventions for building this Angular app (incl.
  generating the API layer from `openapi.yaml`).

@skills/context-guardian/SKILL.md
@skills/angular-project/SKILL.md

<!--
HOW TO ADD A NEW SKILL
1. Drop the bundle in skills/  (e.g. skills/my-skill.skill)
2. Extract it:  cd skills && unzip -o my-skill.skill -d .
3. Add an import line above:  @skills/my-skill/SKILL.md
The extracted SKILL.md is what gets loaded; keep the .skill bundle as the source.
-->

## API

The backend contract lives in `openapi.yaml` at the project root — consult it for
endpoint shapes, auth, and DTOs before wiring up services.

## Architecture

Angular 20 standalone SPA for the **Product Lifecycle Tracker**. It talks to a
**REST API** (Railway in prod, `localhost:3000` in dev) and uses **Firebase only
for authentication** — Google sign-in produces an ID token that an async HTTP
interceptor attaches as `Authorization: Bearer <token>` to every `/api` call.
There is **no Firestore**.

Folder map (`src/app/`):
- `core/auth/` — `auth.service` (Firebase Google sign-in + `getToken`),
  `auth.interceptor` (async token + 401 handling), `auth.guard` (+ `guestGuard`).
- `core/models/models.ts` — TS types mirroring the OpenAPI schemas + `riceScore()`.
- `core/services/` — one service per entity (`products`, `features`, `sprints`
  incl. nested tasks, `kpis` incl. values) + `notification.service` (toasts).
  List endpoints return a paginated envelope `{ data, meta }` (`Paginated<T>`,
  `PaginationMeta`); services take `(…, page, pageSize)`. Products are scoped
  per-user by the backend (`Product.userId`).
- `shared/` — reusable standalone UI: badge, modal, sparkline (inline SVG),
  toast, confirm dialog/service, empty-state, spinner, `status-meta`.
- `features/` — `auth/login`, `products` (dashboard), `product/` workspace with
  lazy child tabs `features` (RICE/MoSCoW), `sprints` (+ task board), `kpis`,
  `growth`. Growth = a hacking **canvas** (7 sections × fields × notes, `PATCH`
  updates) + RICE-scored **experiments** board, under `…/growth` (see
  `growth/growth-fields.ts` for the section/field scaffold).
- `layout/shell.component` — top bar + user menu + theme toggle, wraps all authed routes.
- `core/theme/theme.service` — light/dark via `data-theme` on <html> + localStorage;
  dark token set lives in `:root[data-theme="dark"]` in `styles.scss`. Initialized
  in the root `App` so it applies app-wide.

Design system: soft/friendly tokens in `src/styles.scss` (CSS custom properties,
`.btn`/`.card`/`.pill`/`.tabs` utility classes). Env config + Firebase keys in
`src/environments/`. Deploy target: **Netlify** (`netlify.toml`).
