# Application Output Structure

Each application generates a folder at `applications/YYYY-MM-DD-[company]-[role-slug]/` in the project root.

## Files Generated

```
applications/
  YYYY-MM-DD-[company]-[role-slug]/
    README.md           ← One-line summary: company, role, score, status
    job-posting.md      ← Raw parsed job description (from Jina)
    analysis.md         ← Deep analysis: score breakdown, gap mapping, positioning
    cover-letter.md     ← Final cover letter (greeting + 2 body paragraphs + concise close)
    cv-data.js          ← CV data file ready to drop into src/_data/
```

## cv-data.js

Drop this file into `src/_data/cv[Company].js` (camelCase — e.g. `cvDeepMind.js`, `cvCrossref.js`), then rebuild:

```bash
bun run build
```

The site will pick up the new CV data automatically.

## Naming Convention

- `company`: lowercase, no spaces (e.g. `iris`, `deepmind`, `crossref`)
- `role-slug`: kebab-case title slug (e.g. `tech-lead`, `staff-engineer`, `head-of-ai`)
- Full folder example: `2026-04-03-iris-tech-lead`

## README.md Template

```markdown
# Application: [Role] at [Company]

| Field | Value |
|-------|-------|
| Company | [Company] |
| Role | [Role Title] |
| URL | [Job URL] |
| Date | [YYYY-MM-DD] |
| Score | [XX]% |
| Status | Applied / Draft / Rejected / Interview |
| Variant ID | [id used in cv-variants.js] |
```
