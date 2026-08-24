# Project guide — sara-design-portfolio

A file-by-file reference so you can make changes yourself without needing
to ask what something does first. Organized by folder, in the order
you'd actually touch things.

---

## The files you'll actually edit regularly

### `src/content/case-studies/` and `src/content/explorations/`

This is your CMS. Every project is one `.mdx` file — metadata at the top
(frontmatter, between the `---` lines), written content below it as
plain Markdown headings and paragraphs.

- `_TEMPLATE.mdx` in each folder — duplicate this to start a new project.
  Files starting with `_` are ignored by the site, so the template never
  accidentally shows up as a real project.
- `example-project.mdx` / `example-exploration.mdx` — placeholders proving
  the pipeline works. Delete these once you have two real entries.

**Case study frontmatter fields:** `slug`, `client`, `projectTitle`,
`oneLiner`, `featured`, `designType` (array — powers the liquid nav
filter), `role`, `year`, `status`, `skills`, `thumbnailImage`, `gifImage`,
`heroImage`. Body must contain all six `## Overview` / `## Discovery` /
`## Research` / `## Process` / `## Final Design` / `## Reflection`
headings — the site refuses to build if one's missing.

**Exploration frontmatter fields:** `slug`, `name`, `oneLiner`,
`explorationYear`, `category`, `client` (optional), `clientLogo`
(optional), `color`, `mainImage`, `video` (optional), `images`, `role`,
`skills`, `collaborators` (optional), `painPoints`, `solutions`,
`learnings`. Body has `## Summary` and `## Project Details`.

**Image paths in frontmatter** are root-relative, e.g.
`/media/case-studies/hakmigo/thumbnail.webp` — that maps directly to a
real file at `public/media/case-studies/hakmigo/thumbnail.webp`.

### `public/media/`

Every image and video, organized by type:
- `icons/` — dimmer sun/moon, nav icons
- `footer/` — the 404 footer animation
- `case-studies/<slug>/` and `explorations/<slug>/` — one folder per
  project, matching the slug in that project's `.mdx` file
- `misc/` — anything not yet sorted (leftover files from reorganizing,
  not currently referenced anywhere)

To add media for a project: create `public/media/case-studies/your-slug/`,
drop the files in, then point at them from that project's `.mdx`
frontmatter (or in the body with `![alt](/media/case-studies/your-slug/pic.webp)`).

### `src/app/globals.css`

Every site-wide style lives here — this is your design system file.
Sections, in order:
1. Next.js defaults (mostly unused now, harmless)
2. **Design tokens** — `--color-text`, `--color-text-muted`,
   `--color-text-light-muted`, `--color-brand-orange`,
   `--color-brand-blue`. Change a value here, it updates everywhere that
   references it with `var(--color-text)` etc.
3. **Dimmer stages** — five `:root[data-dimmer-stage="..."]` blocks, each
   setting `--bg` / `--fg` / `--fg-muted`. Only "light" uses your
   confirmed colors right now; warm/dusk/charcoal/near-black are still
   placeholders.
4. `.project-card-media` / `.project-card-placeholder` — the card image
   box and its striped "no photo yet" pattern.
5. `.sara-float-nav` / `.float-nav-item` — the liquid glass filter pill
   and its buttons, including the bounce animation.

---

## `src/components/` — the UI pieces

- **`Header.tsx`** — top bar. Live NY clock, live weather (Open-Meteo,
  no key needed), "Available September 2026" status, Services list,
  Resume/Connect/Github/X links, Connect button. Edit the visible text
  strings directly in this file.
- **`Dimmer.tsx`** — the bottom-right circular toggle. Cycles through 5
  stages on click, remembers your choice via `localStorage`. The actual
  colors for each stage live in `globals.css`, not here.
- **`SaElie.tsx`** — the AI chat modal, bottom-left ✨ button. Suggested
  questions and their answers are hardcoded in the `PLACEHOLDER_ANSWERS`
  object near the top — replace those strings with your real answers.
  Open-ended questions aren't wired to a real backend yet.
- **`LiquidNav.tsx`** — the filter pill itself (All/Product/Web/Brand/
  Creative). To add or rename a filter category, edit the `FILTERS`
  array at the top.
- **`HomeGrid.tsx`** — holds the filter state and decides which cards are
  visible based on the selected filter. This is what connects LiquidNav
  to ProjectCard.
- **`ProjectCard.tsx`** — one card: image, type tag pills, title, year.
  Orange accent for case studies, blue for explorations — set in the
  `ACCENT` object.
- **`Button.tsx`** — the reusable orange pill button used in the header
  and elsewhere. Also exports `EyeIcon` for the "View case study" style.

---

## `src/app/` — pages and routing

- **`layout.tsx`** — wraps every single page. This is where Dimmer,
  Header, and SaElie get rendered so they show up site-wide, plus
  site-wide `<title>`/metadata defaults.
- **`page.tsx`** — the homepage. Reads all case studies and explorations,
  hands them to `HomeGrid`.
- **`case-studies/[slug]/page.tsx`** — one template that renders *every*
  case study. The `[slug]` in the folder name means Next.js generates a
  real page per project automatically — you never create these
  individually.
- **`explorations/[slug]/page.tsx`** — same idea, for explorations.
- **`sitemap.ts`** / **`robots.ts`** — auto-generate `sitemap.xml` and
  `robots.txt` from whatever's in your content folders. No manual list to
  maintain; add a project, it's in the sitemap on next deploy.

---

## `src/lib/` — the plumbing

- **`content.ts`** — reads every `.mdx` file, validates it against the
  schema, throws a specific error if something's missing or malformed.
  This is *why* a broken content file fails loudly instead of quietly
  breaking a page.
- **`site.ts`** — one constant, `SITE_URL`, read from the
  `NEXT_PUBLIC_SITE_URL` environment variable. Everything SEO-related
  reads from here.

## `src/content/types.ts`

The actual schema definitions (using `zod`) for both content types —
every field name, whether it's required, and the error message shown
when it's missing. If you ever want to add a new frontmatter field
(say, a `featuredQuote`), this is the one file to edit, plus the
matching `_TEMPLATE.mdx`.

---

## Root-level files — mostly leave these alone

- **`package.json`** — the project's dependencies and npm scripts
  (`npm run dev`, `npm run build`). You'll see this update automatically
  when you `npm install` something new; rarely hand-edit it.
- **`.env.local`** — your local environment variables (currently just
  `NEXT_PUBLIC_SITE_URL`). Never committed to git (see `.gitignore`).
- **`.env.local.example`** — a template showing what env vars exist,
  safe to commit since it has no real values.
- **`tsconfig.json`** — TypeScript config. The one useful thing to know:
  `@/` is an alias for `src/`, which is why imports look like
  `@/components/Header` instead of long relative paths.
- **`next.config.ts`**, **`eslint.config.mjs`**, **`postcss.config.mjs`**
  — framework/tooling config, not something you'd typically touch.
- **`.gitignore`** — tells git what *not* to track (`node_modules`,
  `.env.local`, build output). This is what keeps your repo clean.
- **`AGENTS.md`** / **`CLAUDE.md`** — auto-generated by Next.js itself,
  notes for AI coding tools about this framework version. Not something
  you write or need to read.
- **`package-lock.json`**, **`next-env.d.ts`** — fully auto-generated,
  never hand-edit these.

---

## How do I...

**...add a new case study?**
Duplicate `src/content/case-studies/_TEMPLATE.mdx`, rename it to your
slug (e.g. `hakmigo.mdx`), fill in the frontmatter and six sections, and
drop matching images in `public/media/case-studies/hakmigo/`.

**...add a new design exploration?**
Same idea, in `src/content/explorations/`.

**...change a color site-wide?**
Edit the value in the `:root { }` design tokens block at the top of
`globals.css`.

**...add a new filter category (e.g. "Motion")?**
Add it to the `FILTERS` array in `LiquidNav.tsx`, then use that exact
word in a project's `designType` array in its `.mdx` frontmatter.

**...change what Sa Elie says for a suggested question?**
Edit the matching string in the `PLACEHOLDER_ANSWERS` object in
`SaElie.tsx`.

**...add a new icon or button somewhere?**
For a one-off icon, follow the pattern in `Button.tsx`'s `EyeIcon` —
a small inline SVG component. For a reusable button style, extend
`Button.tsx` rather than writing a new one-off button each time.
