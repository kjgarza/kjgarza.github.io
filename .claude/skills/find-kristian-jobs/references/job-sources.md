# Job Sources Registry

Every source the search is allowed to sweep, and the cheapest correct way to read it.

**Rule: if a company appears in the Board API table below, never browser-scrape its career page.** One `fetch-board.sh` call returns the whole board as JSON with dates. Browser fetches are budget-capped; board API calls are not.

---

## 1. Board APIs (free, structured, dated) — preferred

```bash
bash .claude/skills/find-kristian-jobs/scripts/fetch-board.sh <ats> <board>
```

Returns `{ats, board, count, jobs: [{title, location, posted_date, url, apply_url, remote, listed, department}]}`.

| Company | Tier | ATS | Board slug | Roles (verified 2026-07-24) |
|---------|------|-----|-----------|------|
| **OpenAI** | 1 | ashby | `openai` | 741 |
| **Anthropic** | 1 | greenhouse | `anthropic` | 407 |
| **Google DeepMind** | 1 | greenhouse | `deepmind` | 10 |
| **Cohere** | 1 | ashby | `cohere` | 137 |
| **Notion** | 3 | ashby | `notion` | 139 |
| **Replit** | 3 | ashby | `replit` | 92 |
| **LangChain** | 3 | ashby | `langchain` | 85 |
| **Vercel** | 3 | greenhouse | `vercel` | 80 |
| **Elicit** | 3 | ashby | `elicit` | 11 |
| **Chan Zuckerberg Initiative** | 2 | greenhouse | `chanzuckerberginitiative` | 11 |
| **Elsevier / RELX** | 3 | greenhouse | `elsevier` | 9 |
| **Perplexity** | 1 | ashby | `perplexity` | 85 |
| **Faculty AI** (London) | 2 | ashby | `faculty` | 66 |
| **DeepL** | 2 | ashby | `deepl` | 36 |
| **Isomorphic Labs** | 2 | greenhouse | `isomorphiclabs` | 20 |
| **Quantexa** | 3 | ashby | `quantexa` | 30 |
| **Speechmatics** | 3 | greenhouse | `speechmatics` | 10 |
| **PolyAI** | 3 | greenhouse | `polyai` | 15 |
| **Wayve** | 3 | ashby *or* greenhouse | `wayve` | 118 / 120 |
| **Graphcore** | 3 | greenhouse | `graphcore` | 217 |
| **Helsing** (defence — values call) | 3 | greenhouse | `helsing` | 122 |
| **Celonis** (Munich HQ) | 3 | greenhouse | `celonis` | 226 |
| **Databricks** | 3 | greenhouse | `databricks` | 794 |
| **Scale AI** | 3 | greenhouse | `scaleai` | 196 |
| **Monzo** | 3 | greenhouse | `monzo` | 76 |
| **ElevenLabs** | 3 | ashby | `elevenlabs` | 211 |
| **Synthesia** | 3 | ashby | `synthesia` | 76 |
| **Aleph Alpha** | 3 | ashby | `alephalpha` | 8 |
| **Black Forest Labs** (Freiburg) | 3 | greenhouse | `blackforestlabs` | 13 |
| **Stability AI** | 3 | greenhouse | `stabilityai` | 4 |
| **Cursor / Anysphere** | 3 | ashby | `cursor` | 121 |
| **Harvey** | 3 | ashby | `harvey` | 342 |
| **Sierra** | 3 | ashby | `sierra` | 165 |
| **Lovable** | 3 | ashby *or* greenhouse | `lovable` | 68 / 58 |
| **Together AI** | 3 | greenhouse | `togetherai` | 58 |
| **Fireworks AI** | 3 | ashby *or* greenhouse | `fireworksai` | 46 |
| **n8n** (Berlin) | 3 | ashby | `n8n` | 40 |
| **Langfuse** | 3 | ashby | `langfuse` | 9 |
| **Improbable** | 3 | ashby | `improbable` | 9 |
| **Tractable** | 3 | ashby | `tractable` | 4 |
| **dunnhumby** | 3 | greenhouse | `dunnhumby` | 72 |

All rows below Elsevier were discovered and verified on 2026-07-24 by the London/Munich run. Some boards resolve on the EU Greenhouse host (`job-boards.eu.greenhouse.io`) — `fetch-board.sh` handles this transparently.

Data quality by ATS — matters for the freshness filter:

| ATS | Date field | Trust | Delisting signal |
|-----|-----------|-------|------------------|
| **ashby** | `publishedAt` — true publish timestamp | **high** — filter on it directly | `isListed: false` → treat as closed |
| **greenhouse** | `updated_at` — proxy only | medium — read as "not older than" | none; job absent from board = gone |
| **lever** | `createdAt` — true creation time | high | none |

Ashby boards carry **zombie postings**: `isListed: true` with a `publishedAt` from years back (Elicit still lists a 2021 ML Engineer role). Always apply the 5-month rule to `posted_date` even when `listed` is true.

**No board API found** (browser or WebSearch only): Mistral AI, Hugging Face, Weights & Biases, Allen Institute / Semantic Scholar, Crossref, ORCID, OpenAlex, Springer Nature, Protocol Labs, Wellcome, EMBL-EBI, CERN, Holtzbrinck. Slug guesses were probed and all 404'd — don't burn budget re-probing; use a browser or WebSearch for these.

Also probed and dead as of 2026-07-24 (do not re-probe): Personio, Snyk, Revolut, Thought Machine, Darktrace, Builder.ai, Glean, Contextual AI, Exscientia, BenevolentAI, Starling Bank, Checkout.com, Anthropic-adjacent slug variants of DeepMind. **Mistral AI**: `lever/mistral` still resolves but now returns `[]` — the board that seeded `leads/pipeline.json` has been emptied or moved, and no Ashby/Greenhouse equivalent exists. Merantix uses its own host, `careers.merantix-aicampus.com`.

To test a new company cheaply, try the slug against all three ATSes before adding it here:
```bash
for ats in ashby greenhouse lever; do
  bash .claude/skills/find-kristian-jobs/scripts/fetch-board.sh $ats <slug> | jq -c '{ats,count,error}'
done
```

---

## 2. Google Careers (Jina-rendered, undated)

Google has **no public jobs API** — `/about/careers/applications/api/v3/search/` and `careers.google.com/api/v3/` both return 404, and the results page is a client-rendered JS app whose raw HTML contains no listings. Jina Reader executes it, so:

```bash
bash .claude/skills/find-kristian-jobs/scripts/fetch-board.sh google "machine learning" "Berlin Germany"
```

**Always search by keyword, never dump a bare location.** The unfiltered Berlin list returns ~13 roles that are almost entirely Cloud sales, customer engineering and DACH account management — one keyword query cut it to the single relevant hit (AI Infrastructure Engineer). Suggested queries, 2 per run maximum:

- `"machine learning"` + `Berlin Germany`
- `"research infrastructure"` + `Germany`
- `"knowledge graph"` + `Germany`

**Google DeepMind London lives HERE, not on the `deepmind` Greenhouse board.** Verified 2026-07-24: the `deepmind` Greenhouse board carries only ~10 US roles (Mountain View / NYC / Seattle). DeepMind's London roles are on Google Careers and are retrieved by using `DeepMind` as the keyword:

```bash
bash .claude/skills/find-kristian-jobs/scripts/fetch-board.sh google "DeepMind" "London UK"
```

That query returns ~20 London roles, the DeepMind-branded ones being mostly Research Scientist / Research Engineer posts (agent post-training, AGI safety & alignment, tool use, RL, robotics, protein design) plus a fixed-term Production Engineer. Sweep both sources: Greenhouse `deepmind` for US, Google Careers keyword `DeepMind` for London. Munich returns almost nothing DeepMind-related.

**Google publishes no posted date anywhere** — not on the results page, not on the posting. `fetch-board.sh google` always returns `posted_date: "unknown"` and requests `sort_by=date`, so the returned order is newest-first. See the freshness exemption in SKILL.md.

---

## 3. Browser sources (budget-capped)

Only for companies with no board API:

- `https://holtzbrinck.com/en/jobs`
- LinkedIn Jobs, authenticated, `f_TPR=r12960000` (past ~150 days)
- Any Tier 2/3 career page from `target-companies.md` not listed in section 1

---

## 4. WebSearch

Track A (AI labs) and Track B (research infrastructure) query sets in SKILL.md. Keep for discovering companies **not** on the target list — it is the only source that finds unknown employers. Board APIs cover the known ones far more cheaply, so don't spend WebSearch queries re-finding OpenAI or Anthropic roles.

---

## Geography pre-filter

Apply **before** fetching a posting's full content, not after scoring:

- Discard roles whose location is US-only or a US-timezone remote requirement (e.g. Elicit's "Oakland, CA (or remote within US timezones)") — work arrangement is 15% of the score and these top out around 60%, so fetching them wastes budget.
- **Keep** anything saying EMEA, Europe, Germany, Berlin, "remote (global)", or listing a European secondary location.
- Elicit is the standing example: strong domain fit, all engineering roles US-timezone-locked. Sweep it anyway — it has opened EMEA-remote roles before — but expect most runs to filter everything out. Note it in the run report rather than silently dropping the company.
