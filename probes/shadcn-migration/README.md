# Probes: shadcn-style components without React (option C)

Throwaway spikes run before committing to option C: rebuild the CSS with
Tailwind v4, add shadcn-style Nunjucks macros, and maybe pull in
[Basecoat](https://basecoatui.com). None of this is wired into the site build.

## Findings

| # | Probe | Result |
|---|-------|--------|
| 1 | Classes used in `_site` vs rules in the frozen `b79f6ce842955dc5.css` | ~45 utilities in templates have **no CSS**, so they silently do nothing. The visible one is the desktop nav: `hidden … sm:flex` and `sm:hidden` don't exist, so since d230e1b (Apr 2026) desktop shows only the burger and never the nav links. Also dead: the Publications badges, dividers and hover states, the `rotate-*` tilts on Tools cards, and the mobile menu's `shadow-xl`, `border-neutral-100` and transitions. |
| 2 | Screenshot harness (8 pages × desktop/mobile) | Deterministic on desktop. ~1% noise on mobile `/` and `/work/` from the big hero images. |
| 3 | Rebuild the CSS from `tailwind.css` (Tailwind 4.3, `@tailwindcss/typography`) | Compiles in ~180 ms. 44 KB min / **8.2 KB gzip vs 10.1 KB** frozen. Pixel-identical to the old CSS on every page except where it **turns on** the dead utilities from probe 1: nav, Publications, Tools tilts. The CV renders identically. What's still unmatched is typos only: `align-center`, `before:block:`, `max-h-[]`, `bg-card`, `from-accent/5`, `to-primary/5`, `hover:border-accent/20`. |
| 4 | `ui/button.njk` and `ui/badge.njk` macros (cva-style variant/size maps) | 6/6 reproduce the class sets of the hand-copied markup: 3 button variants (primary, secondary, ghost) × 2 sizes, and 5 badge variants. 4 copies of the button and 8 of the tag pill collapse to a macro call each. |
| 5 | Native `popover` vs the hand-written mobile menu | Current menu: **Esc doesn't close it** and `aria-expanded` stays `"true"` after closing. A `popover` version handles Esc, outside click and aria state natively. The script shrinks from ~50 lines to 3. |
| 6 | Add `basecoat-css@1.1.0` on top | Builds fine (+20 KB gzip for everything), but **token names collide**: Basecoat's `--accent`/`--secondary` produce `text-accent`/`text-secondary` that override the site's own, so body text turns near-white. It also uses `.dark` where the site uses `[data-theme=dark]`. Rename the site's tokens to shadcn's scheme (`--background`, `--foreground`, `--muted-foreground`, `--primary` = brand pink…) **before** importing Basecoat, and import only the component files needed. Its Nunjucks templates cover only JS widgets (dialog, popover, dropdown, tabs…). Button, badge and card are CSS classes (`.btn`, `.badge`, `.card`). |

Also found: `src/work/case-studies/*.html` are leftover Next.js export pages from
the original template author (another person's name, and they load 2.6 MB of
`src/_next/static/chunks`). They're published at `/work/case-studies/…`
but not linked or in the sitemap. They should be deleted along with
`src/_next/static/chunks` when the CSS moves out of `_next/`.

## What this means for option C

1. **The CSS rebuild works, but it changes the look** in the places listed above. Review those
   screenshots as intended fixes rather than regressions, or strip the dead classes first if the current
   look is the one you want.
2. Macros are a safe, mechanical refactor that can be verified with `macros-check.js`.
3. Rename tokens before adopting Basecoat. Basecoat is optional: the macros
   already cover button and badge. It earns its place only once a real
   dialog, tabs or dropdown is needed.

## Re-running

```bash
bun run build
# Tailwind rebuild (needs @tailwindcss/cli@4 and @tailwindcss/typography resolvable from this folder)
tailwindcss -i probes/shadcn-migration/tailwind.css -o /tmp/rebuilt.css --minify
node probes/shadcn-migration/classes.js _site /tmp/rebuilt.css /tmp/used.txt     # undefined classes
cp -r _site /tmp/site-new && cp /tmp/rebuilt.css /tmp/site-new/_next/static/css/b79f6ce842955dc5.css
node probes/shadcn-migration/shots.js _site /tmp/shots/before
node probes/shadcn-migration/shots.js /tmp/site-new /tmp/shots/after
python3 probes/shadcn-migration/diff.py /tmp/shots/before /tmp/shots/after /tmp/shots/diff
node probes/shadcn-migration/macros-check.js
node probes/shadcn-migration/popover-check.js _site probes/shadcn-migration
```
