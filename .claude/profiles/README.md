# Candidate Profiles

The job-search skills (`find-kristian-jobs`, `generate-application`, `job-pipeline`,
`find-linkedin-contacts`) are **profile-parameterized**. Skill logic is shared; everything
candidate-specific lives behind a profile.

```
.claude/profiles/
  kristian/config.json     <- default profile
  claudia/config.json
```

## Resolving a profile (Step 0 of every skill)

1. If the invocation passes `--profile <id>`, use that id.
2. Otherwise if `$JOB_PROFILE` is set in the environment, use it.
3. Otherwise use the profile whose config has `"default": true` (currently `kristian`).

Then read `.claude/profiles/<id>/config.json` and resolve every path in its `references`
and `storage` blocks. **All paths in a config are repo-root-relative.** Never hardcode a
candidate's file path inside a SKILL.md again; go through the config.

Unknown profile id, or a `references` path that does not exist on disk: stop and tell the
user which file is missing. Do not silently fall back to another candidate's data — writing
one person's proof points into another person's cover letter is the failure mode this
indirection exists to prevent.

## config.json schema

| Key | Meaning |
|-----|---------|
| `id` | Profile id; must equal the directory name |
| `displayName` | Candidate's full name, used in generated documents |
| `default` | `true` on exactly one profile |
| `references.profile` | Full candidate profile used for scoring and CV generation |
| `references.searchProfile` | Profile variant used by the search skill (may equal `profile`) |
| `references.targetCompanies` | Tiered target-company list |
| `references.scoringMatrix` | Scoring dimensions, weights, thresholds |
| `references.toneAndVoice` | Voice rules for cover letters, CV profile, bullets |
| `references.decisionPolicy` | Comp targets, score modifiers, action thresholds |
| `storage.leads` | Ledger directory (`<leads>/pipeline.json` is the ledger) |
| `storage.applications` | Application package output directory |
| `storage.cv` | Directory holding the candidate's CV source or PDF (optional) |
| `cv.mode` | `data-driven` (render from `cv-data.js`) or `static-pdf` (upload an existing file) |
| `cv.*` | Mode-specific fields; see the configs |
| `search.titles` | Job titles the search skill queries for |
| `search.locations` | Preferred locations |

## Where a profile's files live

Two layouts are supported, and the config is what tells the skills which one applies.

- **In-repo** — reference files tracked in git. Used by `kristian`, whose profile is
  public-facing anyway (this repo builds his personal site). His files stay at their
  original skill paths; the config points at them.
- **In external storage** — reference files live under the untracked storage symlink.
  Used by `claudia`. This repo is public, so a third party's CV, contact details, and
  salary expectations must never be committed. Only her non-PII files (scoring matrix,
  tone and voice, target companies) are tracked here.

Run `scripts/setup-storage.sh` once per clone or worktree to create the symlinks and seed
any missing storage-side profile files. See `scripts/validate-profiles.sh` for the
regression check that both profiles still resolve.

## Adding a profile

1. `mkdir .claude/profiles/<id>` and write `config.json` (copy `claudia/config.json`).
2. Put PII-bearing files (`profile.md`, `decision-policy.md`, CV) in external storage,
   never in the repo.
3. Run `scripts/setup-storage.sh` then `scripts/validate-profiles.sh`.
