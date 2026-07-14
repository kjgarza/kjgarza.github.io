# Decision Policy

Kristian's stated goals, in priority order:
1. **Innovative work** — frontier AI, research infrastructure, things that didn't exist 2 years ago. Not maintenance, not generic SaaS.
2. **Very good money** — compensation is a first-class dimension, not an afterthought.
3. **Speed** — move fast, don't let opportunities expire while packages sit in Draft.

This file is the contract for unattended decisions. Edit the numbers here; the pipeline obeys them.

## Score modifiers (applied after the base find-kristian-jobs score)

| Signal | Modifier |
|--------|----------|
| Frontier AI lab or AI-native product company (Anthropic, Mistral, Cohere, HF, etc.) | +5 |
| Posting lists salary ≥ comp target (see below) | +5 |
| Posting lists salary clearly below comp floor | −15 |
| No salary listed | 0 (flag "comp unknown" in report — resolve via levels.fyi/Glassdoor lookup when preparing) |
| Role is primarily maintenance/legacy/internal tooling | −10 |
| Application deadline within 14 days | flag URGENT, prioritize in prepare queue |

## Compensation targets

> ⚠️ EDIT ME — placeholders based on Berlin Staff/Principal AI market, not confirmed by Kristian.

| Parameter | Value |
|-----------|-------|
| Comp floor (base, EUR) | 110,000 |
| Comp target (base, EUR) | 140,000+ or equivalent total comp |
| Salary-expectation answer for forms | "€130,000–150,000 base depending on total package" (adjust per company tier) |
| Notice period answer | 3 months (German standard — confirm contract) |
| Start date answer | per notice period |
| Relocation | Open for exceptional roles (e.g. London/Zurich frontier labs); prefer Berlin or remote EU |

## Action thresholds (modified score)

| Modified score | Action |
|----------------|--------|
| ≥ 75 | **AUTO-PREPARE** — full package + answers + contacts, no human prompt |
| 60–74 | **NOTIFY-ONLY** — scored entry in report; human decides whether to prepare |
| < 60 | **PASS** — ledger entry with one-line reason |

Exception: any score ≥ 60 at a Tier-1 target company (see find-kristian-jobs `references/target-companies.md`) is upgraded to AUTO-PREPARE — don't miss frontier-lab openings over a borderline score.

## Speed SLAs

| Event | Deadline |
|-------|----------|
| New AUTO-PREPARE job discovered | package ready same run |
| Package `prepared` | surfaced for approval in every report until acted on |
| `prepared` > 7 days old | escalate: top of report, Telegram ping |
| Posting closes while `prepared` | record as missed opportunity in report — these are the failures to learn from |

## Never autonomous

- Clicking submit on an application
- Sending LinkedIn/email outreach
- Committing salary numbers different from this file
