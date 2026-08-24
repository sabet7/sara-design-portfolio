# sara-portfolio — starter

A working Next.js seed with the case-study / design-exploration content
pipeline built and verified: MDX + frontmatter, zod validation, static
generation. Media lives in this same repo under `public/media/` — no
separate repo, no CDN env var, just Vercel serving your `/public` folder.

## Run it locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000 — two demo entries pull live from their MDX
files, and the placeholder images load from public/media/.

## Add real content

- Case study: duplicate `src/content/case-studies/_TEMPLATE.mdx`, rename to
  your project's slug, fill it in. Drop its images/video in
  `public/media/case-studies/your-slug/`.
- Design exploration: same idea, in `src/content/explorations/_TEMPLATE.mdx`
  and `public/media/explorations/your-slug/`.
- Delete `example-project.mdx` / `example-exploration.mdx` (and their
  public/media folders) once you have real entries.

If a file is missing a required field, `npm run build` (or `cp .env.local.example .env.local
npm run dev`)
fails with a specific error naming the file and field.

## Migrating your existing assets from sara-site-media

1. Clone this repo and clone `sara-site-media` locally.
2. Sort the flat files into folders as you copy them in, e.g.:
   - `dimmer_sun_static_icon.webp` -> `public/media/icons/dimmer-sun.webp`
   - `dimmer_ moon_static_icon.webp` -> `public/media/icons/dimmer-moon.webp`
   - `dream_footer_1.25x_v2.webp` (or whichever is the current version) ->
     `public/media/footer/footer.webp`
   - `Work_1.25x.webp` / `Playground_1.25x.webp` -> `public/media/icons/`
3. Commit and push. Once everything's moved over, the old
   `sara-site-media` repo can be archived.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: content pipeline"
git branch -M main
git remote add origin https://github.com/sabet7/YOUR-REPO.git
git push -u origin main
```

## Deploy

Import the repo at vercel.com — Next.js is auto-detected, no config needed.
