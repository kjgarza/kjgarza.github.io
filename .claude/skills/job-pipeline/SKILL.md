---
name: job-pipeline
description: "This skill should be used when the user says \"run the job pipeline\", \"what's in my pipeline\", \"any new jobs\", asks for the whole search→apply flow without prompting each step, or a scheduled/unattended job search run fires. Autonomous end-to-end job pipeline — search, score, decide, prepare full application packages (CV, cover letter, application-form answers, contacts), track state, and notify. Composes find-kristian-jobs, generate-application, and find-linkedin-contacts. Profile-parameterized: defaults to Kristian, pass --profile <id> (e.g. claudia)."
version: 0.2.0
argument-hint: "[run | status | approve <url-or-slug> | submit <url-or-slug>] [--profile <id>]"
---

# job-pipeline

End-to-end orchestrator. One invocation takes a job from *unknown* to *ready-to-submit package + outreach plan* with no human prompting in between. The human is only needed at two points: setting policy (once, in the profile's decision policy) and approving submission.

## Step 0: resolve the profile

Every mode starts here.

1. `--profile <id>` in the invocation wins.
2. Otherwise `$JOB_PROFILE` from the environment.
3. Otherwise the profile with `"default": true` (currently `kristian`).

Read `.claude/profiles/<id>/config.json` and resolve `storage.leads`, `storage.applications`, and `references.decisionPolicy`. Below these are written `<leads>`, `<applications>`, and `<decisionPolicy>`; all config paths are repo-root-relative. Unknown id or missing reference file: stop and name it. See `.claude/profiles/README.md`.

**Each profile has its own ledger and its own policy.** Never score one candidate's leads against another's policy, and never write a package into another profile's applications directory. Pass the resolved `--profile` through to every skill this one invokes. A bare invocation resolves to `kristian`, exactly as before profiles existed.

## State: the ledger

`<leads>/pipeline.json` is the single source of truth for this profile — `leads/pipeline.json` for `kristian`, `claudia/leads/pipeline.json` for `claudia`. **Read it before doing anything; write it after every state change.**

- If `<leads>` or its `pipeline.json` doesn't exist yet, run `scripts/setup-storage.sh` (it creates the symlinks and seeds an empty ledger), then proceed. Do not create a plain directory in the repo — lead data must never be committed.
- Keyed by job URL. Statuses: `discovered → scored → preparing → prepared → notified → approved → submitted → interviewing → offer`, terminal: `rejected | passed | expired`.
- Never re-fetch, re-score, or re-prepare a URL that's already in the ledger unless its status is `discovered` or the user explicitly asks. This is what stops every run from redoing old work.
- When a posting turns out closed/older than 5 months, set status `expired` with a note — keep the entry so it stays deduplicated.
- Update the `updated` field on every write.

## Decision policy

Read `<decisionPolicy>` before scoring or deciding anything. It encodes that candidate's goals as score modifiers and action thresholds (for `kristian`: innovation, compensation, speed). The policy decides what happens to each job — not the user, not ad-hoc judgment. Read the resolved file every run; never decide from a remembered threshold.

## Command routing

| Input | Mode |
|-------|------|
| `/job-pipeline` or `/job-pipeline run` | **Full run** (the default, also used by cron) |
| `/job-pipeline status` | **Status report** from the ledger |
| `/job-pipeline approve <url-or-slug>` | Mark approved, proceed to submission prep |
| `/job-pipeline submit <url-or-slug>` | **Assisted submission** via browser |

---

## Mode: Full run

Designed to work unattended (cron, remote trigger, `--print`). Never ask interactive questions in this mode; make the policy decision and record it.

### 1 — Sweep the existing pipeline first (don't miss what you already have)

Before searching for anything new:

1. Read `<leads>/pipeline.json`.
2. For every job in status `prepared` or `notified`: re-check it's still open (`fetch-job.sh <url>`, check `.status`). If closed → status `expired`, flag prominently in the final report ("missed: X closed before submission").
3. For every `prepared` job missing `answers: true`: generate `application-questions.md` now using generate-application Step 9, set `answers: true`.
4. For every GO job missing `contacts: true`: invoke `find-linkedin-contacts`, save output to the package folder, set `contacts: true`.
5. Flag any job sitting in `prepared`/`notified` for more than 7 days — these are the leaks; speed is a stated goal.

### 2 — Search

Invoke the `find-kristian-jobs` skill, Full Search mode, passing the resolved `--profile` (its budgets and freshness rules apply). Before scoring, drop every URL already present in the ledger. Add each genuinely new posting to the ledger as `discovered`.

### 3 — Score and decide

Score each new posting with the profile's scoring matrix (`references.scoringMatrix`), then apply the modifiers and thresholds from `<decisionPolicy>`. Record `score`, `recommendation`, and the decided action in the ledger (`scored`). Apply the policy actions:

- **AUTO-PREPARE**: run the full generate-application skill (analysis, CV output per the profile's `cv.mode`, cover letter, **application-questions.md**) and `find-linkedin-contacts`, end-to-end, without asking. Ledger → `prepared`, with `package`, `answers`, `contacts` fields set.
- **NOTIFY-ONLY**: ledger → `scored`, include in report for human decision.
- **PASS**: ledger → `passed` with one-line reason. Never silently drop a job — every discovered URL gets a ledger entry.

### 4 — Report and notify

Write the run summary to `<leads>/YYYY-MM-DD-pipeline-run.md`:

- New jobs found / prepared / passed (with reasons)
- Pipeline health: stale items, expired items ("missed opportunities"), items awaiting approval
- For each prepared package: path, score, deadline if known, and the exact next action ("review answers, then `/job-pipeline submit <url>`")
- Any `⚠️ NEEDS INPUT` fields from application-questions.md files

Then push the summary to the repo owner (nobody is at the terminal during scheduled runs). Name the profile in the digest so a multi-profile run is never ambiguous:
1. **Telegram** if the channel is available: send a short digest (counts + top items + needed decisions) via the telegram reply tool.
2. Otherwise `PushNotification` with a one-line summary.
3. The `openclaw system event` command if running inside the OpenClaw container (detect via `$OPENCLAW_*` env or `/home/node/.openclaw` existing).

### Run budget

One full run = find-kristian-jobs budgets + max 3 AUTO-PREPARE packages. If more than 3 jobs qualify, prepare the 3 highest-scored and leave the rest as `scored` with action `AUTO-PREPARE (deferred)` — the next run picks them up.

---

## Mode: Status report

Read the ledger, print a table grouped by status (active first), flag: stale `prepared` items, unknown deadlines on GO jobs, `⚠️ NEEDS INPUT` markers, anything `expired` in the last 14 days. End with the single most valuable next action.

## Mode: Approve

Set the job's status to `approved`. Verify the package is complete (analysis, CV output per the profile's `cv.mode`, cover letter, application-questions.md, contacts); generate anything missing. Re-check the posting is still open. Then offer `/job-pipeline submit`.

## Mode: Assisted submission (human stays in the loop)

Submission is the one irreversible, outward-facing step — it is **never** done unattended.

1. Job must be `approved` (or the user is asking interactively right now — that counts as approval).
2. Open the apply page: `mcp__claude-in-chrome__tabs_create_mcp` → `mcp__claude-in-chrome__navigate` → `mcp__claude-in-chrome__read_page`.
3. Fill every field from `application-questions.md` using `mcp__claude-in-chrome__form_input`; upload the CV PDF with `mcp__claude-in-chrome__file_upload`. Which PDF depends on the profile's `cv.mode`: `data-driven` uses the `[slug].pdf` in the package (build it from `cv-data.js` first if missing), `static-pdf` uses the file at `cv.file`. Ask for the path if neither exists.
4. Refuse to proceed if any `⚠️ NEEDS INPUT` field is unresolved.
5. **Stop before clicking the final submit button.** Screenshot the filled form (`mcp__claude-in-chrome__computer`, screenshot action), show it, and get an explicit yes. Only then click submit.
6. Ledger → `submitted` with date; suggest sending the P1 outreach messages from the contacts file.

---

## Hard rules

- Ledger first, ledger last — a run that doesn't update `<leads>/pipeline.json` is a failed run.
- One profile per run. Resolve it in Step 0, pass it to every composed skill, and name it in the report.
- Never submit, send, or publish anything external without explicit human approval in the same conversation.
- Honest packages: same authenticity rules as generate-application — no invented experience, gaps stated.
- All money/relocation/start-date answers come from the resolved profile's decision policy, never improvised. If that file still carries `[FILL ME]` markers, the answer stays a `[FILL ME]` and the job cannot reach `approved`.
