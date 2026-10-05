#!/usr/bin/env python3
"""Find the LinkedIn job-search queries that best surface roles like a seed posting.

Give it a LinkedIn job you'd want (e.g. Perplexity "Member of Technical Staff
(AI Researcher)"). It builds boolean query variants (title group x domain group
x location), collects each query's results, judges every result title against a
relevance profile, and keeps the smallest set of queries that covers the most
relevant jobs. Output: ranked queries with precision, ready-to-click LinkedIn
search URLs, and the relevant jobs found (flagged when already in leads/pipeline.json).

Two ways to collect results:

  Logged-in (preferred, interactive) — runs in Kristian's own LinkedIn session:
    1. scripts/linkedin-query-optimizer.py <seed-url> --plan-out plan.json
    2. For each plan entry, open its `url` in the logged-in browser (claude-in-chrome),
       run scripts/linkedin-extract.js in the page, append the returned JSON line to
       results.jsonl. If `total` > 25, also open the URL with &start=25.
    3. scripts/linkedin-query-optimizer.py <seed-url> --results results.jsonl
  Logged-in search applies booleans strictly and states an exact total, adds
  salary / "actively reviewing" / alumni-and-connection / Easy Apply / viewed
  signals, and found roles the guest API missed (Cohere "MTS, Post-Training").

  Guest (default, unattended) — LinkedIn's public guest API, no login:
    scripts/linkedin-query-optimizer.py <seed-url> [--locations ... --days 14 --pages 1]
  The guest API pads weak queries with filler, so only judged precision means anything.

Why titles, not description jargon (probed 2026-10-05): both modes match titles,
not descriptions. Guest "GRPO" returned GROPYUS (a construction firm); logged-in
"GRPO" returned one thesis titled with it — and not the Perplexity seed, whose
description names GRPO. A nonsense word returns 10 filler jobs as guest, and
"Jobs you may be interested in" recommendations (no results) when logged in.

Heads-up: as of 2026-10 LinkedIn shows logged-in users "We're gradually retiring
classic job search starting in September" in favour of natural-language AI job
search. Boolean queries may stop working there; extractor rows carry
`classic_retiring` so the report flags it.

Writes leads/linkedin-queries/YYYY-MM-DD-<seed-slug>.{md,json}, and indexes the
recommended *search* URLs in qurl (tags linkedin-query,<seed-slug>) so they're
findable later with `qurl search`. Job URLs are deliberately not added: fetch-job.sh
treats any qurl entry for a job URL as its cached posting, so a stub would shadow
the real description. Stdlib only.
"""
import argparse, datetime as dt, html, itertools, json, os, re, shutil, subprocess, sys, time
import urllib.parse, urllib.request

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/129 Safari/537.36")
GUEST = "https://www.linkedin.com/jobs-guest/jobs/api"

# Title families. LinkedIn treats quoted phrases as phrases; OR/AND/NOT must be uppercase.
TITLE_GROUPS = {
    "core": ['"Research Engineer"', '"Research Scientist"', '"Member of Technical Staff"'],
    "researcher": ['"AI Researcher"', '"Machine Learning Researcher"', '"ML Researcher"', '"Applied Scientist"'],
    "broad": ['"Research Engineer"', '"Research Scientist"', '"Member of Technical Staff"',
              '"AI Researcher"', '"ML Researcher"', '"Applied Scientist"'],
}
# Domain anchors that survive LinkedIn's matching (short, common in titles).
DOMAIN_GROUPS = {
    "none": [],
    "llm-agents-rl": ["LLM", "agents", '"reinforcement learning"'],
    "post-training": ['"post-training"', "RLHF", '"foundation models"', '"large language models"'],
    "agentic-search": ["agentic", "search", '"deep research"'],
}
EXCLUDE = '(intern OR internship OR student OR "Werkstudent")'

# Relevance profile, applied to result titles. Positive needs a role hit AND
# (a domain hit OR an unambiguous research title); any negative vetoes.
ROLE = r"research|scientist|technical staff|\bmts\b|researcher"
DOMAIN = (r"\bllm|language model|\bai\b|machine learning|\bml\b|deep learning|agent|"
          r"reinforcement|\brl\b|post-?training|pre-?training|foundation model|nlp|genai|generative|"
          r"multimodal|\bvlm|reasoning|alignment|model")
STRONG = r"research (engineer|scientist)|ai researcher|ml researcher|machine learning researcher|technical staff"
NEG = (r"intern\b|internship|werkstudent|student|thesis|phd candidate|doktorand|sales|account exec|recruit|"
       r"trainer|marketing|product manager|clinical|chemist|biolog|robotics|hardware|mechanical|"
       r"lab technician|wissenschaftliche mitarbeiter")


def fetch(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")
        except Exception as e:  # 429s are common on the guest API — back off
            if i == retries - 1:
                print(f"  ! {e} — {url[:120]}", file=sys.stderr)
                return ""
            time.sleep(4 * (i + 1))


def posting(job_id):
    t = fetch(f"{GUEST}/jobPosting/{job_id}")
    title = re.search(r'topcard__title">\s*(.*?)\s*</h2>', t, re.S)
    org = re.search(r'topcard__org-name-link[^>]*>\s*(.*?)\s*</a>', t, re.S)
    loc = re.search(r'topcard__flavor topcard__flavor--bullet">\s*(.*?)\s*</span>', t, re.S)
    return {
        "id": job_id,
        "title": html.unescape(title.group(1)) if title else "",
        "company": html.unescape(org.group(1)) if org else "",
        "location": html.unescape(loc.group(1)) if loc else "",
    }


def guest_search(keywords, location, days, start):
    p = {"keywords": keywords, "location": location, "f_TPR": f"r{days * 86400}", "start": start}
    t = fetch(f"{GUEST}/seeMoreJobPostings/search?" + urllib.parse.urlencode(p))
    out = []
    for card in t.split('<li>')[1:]:
        jid = re.search(r'jobPosting:(\d+)', card)
        title = re.search(r'base-search-card__title">\s*(.*?)\s*</h3>', card, re.S)
        co = re.search(r'base-search-card__subtitle">.*?>\s*(.*?)\s*</a>', card, re.S)
        loc = re.search(r'job-search-card__location">\s*(.*?)\s*</span>', card, re.S)
        date = re.search(r'datetime="([\d-]+)"', card)
        if jid and title:
            out.append({
                "id": jid.group(1),
                "title": html.unescape(title.group(1)),
                "company": html.unescape(co.group(1)) if co else "",
                "location": html.unescape(loc.group(1)) if loc else "",
                "posted": date.group(1) if date else "",
            })
    return out


def relevant(title):
    t = title.lower()
    if re.search(NEG, t):
        return False
    return bool(re.search(ROLE, t)) and bool(re.search(DOMAIN, t) or re.search(STRONG, t))


def build_query(titles, domains):
    q = "(" + " OR ".join(titles) + ")"
    if domains:
        q += " AND (" + " OR ".join(domains) + ")"
    return q + " NOT " + EXCLUDE


def browser_url(q, location, days):
    p = {"keywords": q, "location": location, "f_TPR": f"r{days * 86400}", "sortBy": "DD"}
    return "https://www.linkedin.com/jobs/search/?" + urllib.parse.urlencode(p)


def key_of(keywords, location):
    """Match a plan entry to an extracted page whatever LinkedIn did to the URL encoding."""
    return re.sub(r"\s+", " ", keywords).strip().lower() + " @ " + location.strip().lower()


def make_candidates(locations):
    out = []
    for (tg, titles), (dg, domains), loc in itertools.product(TITLE_GROUPS.items(), DOMAIN_GROUPS.items(), locations):
        # A bare title group ("Member of Technical Staff" alone) drowns in generic SWE roles;
        # only allow it in the narrowest location.
        if dg == "none" and loc != locations[0]:
            continue
        q = build_query(titles, domains)
        out.append({"name": f"{tg}+{dg}", "query": q, "location": loc, "key": key_of(q, loc)})
    return out


def collect_guest(candidates, a):
    for i, c in enumerate(candidates, 1):
        hits = []
        for page in range(a.pages):
            res = guest_search(c["query"], c["location"], a.days, page * 10)
            time.sleep(a.delay)
            if not res:
                break
            hits.extend(res)
        c["hits"], c["total"] = hits, None
        print(f"[{i}/{len(candidates)}] guest {len(hits)} hits  {c['name']} @ {c['location']}", file=sys.stderr)


def load_dump(rows_path, jobs_path, plan_path):
    """Turn linkedin-extract.js DUMP output (rows.txt + jobs.txt) into result rows.

    DUMP can't carry the query text (tool output blocks query-string-looking text), so
    rows are matched to plan entries by visit order: each start-0 row is the next plan
    entry, and a start>0 row is a further page of the previous one.
    """
    plan = json.load(open(plan_path))
    jobs = {}
    for line in open(jobs_path, encoding="utf-8"):
        f = [x.strip() for x in line.rstrip("\n").split("|")]
        if len(f) < 8:
            continue
        i, title, co, loc, sal, net, posted, fl = f[:8]
        jobs[i] = {"id": i, "title": title, "company": co, "location": loc, "salary": sal, "network": net,
                   "posted": posted, "actively_reviewing": "R" in fl, "easy_apply": "E" in fl,
                   "viewed": "V" in fl, "applied": "A" in fl}
    out, p = [], -1
    for line in open(rows_path):
        f = [x.strip() for x in line.split(";")]
        if len(f) < 6:
            continue
        _, start, total, empty, cr, ids = f[:6]
        if start == "0":
            p += 1
        if p >= len(plan):
            sys.exit("more start-0 rows than plan entries — rows must follow plan order")
        out.append({"url": plan[p]["url"] + (f"&start={start}" if start != "0" else ""),
                    "total": int(total) if total.isdigit() else None, "empty": empty == "1",
                    "classic_retiring": cr == "1",
                    "jobs": [jobs.get(i, {"id": i}) for i in ids.split(",") if i]})
    return out


def collect_results(candidates, rows, a):
    """Attach logged-in extraction rows to their candidates."""
    by_key = {c["key"]: c for c in candidates}
    for c in candidates:
        c["hits"], c["total"], c["collected"] = [], None, False
    retiring = False
    for row in rows:
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(row["url"]).query)
        k = key_of(qs.get("keywords", [""])[0], qs.get("location", [""])[0])
        c = by_key.get(k)
        if not c:
            print(f"  ! result row matches no candidate: {k[:100]}", file=sys.stderr)
            continue
        c["collected"] = True
        c["total"] = 0 if row.get("empty") else row.get("total")
        retiring |= bool(row.get("classic_retiring"))
        c["hits"].extend(row.get("jobs", []))
    # Cards LinkedIn didn't render come back as bare ids — backfill from the public posting page.
    cache = {}
    for c in candidates:
        for h in c["hits"]:
            if not h.get("title"):
                if h["id"] not in cache:
                    cache[h["id"]] = posting(h["id"])
                    time.sleep(a.delay / 2)
                h.update({k: v for k, v in cache[h["id"]].items() if v})
    missing = [c for c in candidates if not c["collected"]]
    if missing:
        print(f"  ! {len(missing)} plan entries have no results row — scored as empty", file=sys.stderr)
    print(f"Backfilled {len(cache)} unrendered cards from public postings", file=sys.stderr)
    return retiring


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("seed", help="LinkedIn job URL or numeric job id")
    ap.add_argument("--locations", default="Berlin,Germany,European Union")
    ap.add_argument("--days", type=int, default=30, help="posted within N days (f_TPR)")
    ap.add_argument("--pages", type=int, default=2, help="guest mode: result pages per query (10 each)")
    ap.add_argument("--max-queries", type=int, default=0, help="cap candidate queries (0 = all)")
    ap.add_argument("--keep", type=int, default=5, help="queries to recommend")
    ap.add_argument("--delay", type=float, default=1.5, help="seconds between guest requests")
    ap.add_argument("--plan-out", help="write the candidate searches (logged-in URLs) to this JSON and exit")
    ap.add_argument("--results", help="score logged-in extractions from a JSONL file of {url,total,empty,jobs} rows")
    ap.add_argument("--rows", help="logged-in DUMP rows.txt (linkedin-extract.js); needs --jobs and --plan")
    ap.add_argument("--jobs", help="logged-in DUMP jobs.txt (linkedin-extract.js)")
    ap.add_argument("--plan", help="the --plan-out JSON the rows were collected from, in visit order")
    ap.add_argument("--out", default="leads/linkedin-queries")
    ap.add_argument("--no-qurl", action="store_true", help="don't index recommended search URLs in qurl")
    a = ap.parse_args()

    m = re.search(r"(\d{8,})", a.seed)
    if not m:
        sys.exit("seed must be a LinkedIn job URL or id")
    locations = [l.strip() for l in a.locations.split(",") if l.strip()]
    candidates = make_candidates(locations)
    if a.max_queries:
        candidates = candidates[: a.max_queries]

    if a.plan_out:
        json.dump([{**c, "url": browser_url(c["query"], c["location"], a.days)} for c in candidates],
                  open(a.plan_out, "w"), indent=2)
        print(f"Wrote {len(candidates)} searches to {a.plan_out}")
        return

    seed = posting(m.group(1))
    print(f"Seed: {seed['title']} @ {seed['company']} ({seed['location']})", file=sys.stderr)
    rows = None
    if a.rows:
        if not (a.jobs and a.plan):
            sys.exit("--rows needs --jobs and --plan")
        rows = load_dump(a.rows, a.jobs, a.plan)
    elif a.results:
        rows = [json.loads(l) for l in open(a.results) if l.strip()]
    mode = "logged-in" if rows is not None else "guest"
    retiring = collect_results(candidates, rows, a) if rows is not None else (collect_guest(candidates, a) or False)

    ledger_text = open("leads/pipeline.json").read() if os.path.exists("leads/pipeline.json") else ""
    jobs = {}
    for c in candidates:
        seen = {}
        for h in c["hits"]:
            seen.setdefault(h["id"], h)
        rel = [h for h in seen.values() if relevant(h.get("title", ""))]
        c["returned"] = len(seen)
        c["relevant_ids"] = [h["id"] for h in rel]
        c["precision"] = round(len(rel) / len(seen), 2) if seen else 0.0
        for h in rel:
            j = jobs.setdefault(h["id"], {**h, "url": f"https://www.linkedin.com/jobs/view/{h['id']}/",
                                          "found_by": [], "in_ledger": h["id"] in ledger_text})
            for k, v in h.items():  # logged-in rows carry signals guest rows lack
                if v and not j.get(k):
                    j[k] = v
            j["found_by"].append(c["name"] + " @ " + c["location"])
        del c["hits"]

    # Greedy cover: each pick maximises new relevant jobs, weighted by precision so
    # a noisy query that happens to add one job loses to a clean one.
    covered, picks = set(), []
    pool = [c for c in candidates if c["relevant_ids"]]
    while pool and len(picks) < a.keep:
        best = max(pool, key=lambda c: len(set(c["relevant_ids"]) - covered) * (0.5 + c["precision"]))
        gain = len(set(best["relevant_ids"]) - covered)
        if gain == 0:
            break
        best["new"] = gain
        picks.append(best)
        covered |= set(best["relevant_ids"])
        pool.remove(best)

    today = dt.date.today().isoformat()
    slug = re.sub(r"[^a-z0-9]+", "-", f"{seed['company']}-{seed['title']}".lower()).strip("-")[:60]
    os.makedirs(a.out, exist_ok=True)
    base = os.path.join(a.out, f"{today}-{slug}" + ("-loggedin" if mode == "logged-in" else ""))
    tot = lambda c: "" if c.get("total") is None else str(c["total"])

    L = [f"# LinkedIn queries for roles like: {seed['title']} — {seed['company']}",
         "", f"Seed: https://www.linkedin.com/jobs/view/{seed['id']}/ · run {today} · {mode} search · "
         f"posted ≤{a.days}d · {len(candidates)} candidate queries · {len(jobs)} relevant jobs found"]
    if retiring:
        L += ["", "> ⚠️ LinkedIn showed \"retiring classic job search\" — boolean queries may stop working; "
                  "re-check, and consider its AI job search with a plain-English role description."]
    L += ["", "## Recommended queries (greedy cover, in order)", "",
          "| # | Query | Location | Total | Precision | New jobs | Open |", "|---|---|---|---|---|---|---|"]
    for n, c in enumerate(picks, 1):
        L.append(f"| {n} | `{c['query']}` | {c['location']} | {tot(c)} | {c['precision']:.0%} | {c['new']} | "
                 f"[search]({browser_url(c['query'], c['location'], a.days)}) |")
    L += ["", "## All candidates by precision", "",
          "| Name | Location | Total | Precision | Relevant/judged |", "|---|---|---|---|---|"]
    for c in sorted(candidates, key=lambda c: (-c["precision"], -len(c["relevant_ids"]))):
        L.append(f"| {c['name']} | {c['location']} | {tot(c)} | {c['precision']:.0%} | {len(c['relevant_ids'])}/{c['returned']} |")
    L += ["", "## Relevant jobs found", "",
          "| Posted | Title | Company | Location | Salary | Signals | Hits | Ledger |", "|---|---|---|---|---|---|---|---|"]
    for j in sorted(jobs.values(), key=lambda j: -len(j["found_by"])):
        sig = ", ".join(s for s, on in [("actively reviewing", j.get("actively_reviewing")),
                                         ("Easy Apply", j.get("easy_apply")), (j.get("network", ""), j.get("network")),
                                         ("viewed", j.get("viewed")), ("applied", j.get("applied"))] if on)
        L.append(f"| {j.get('posted', '')} | [{j['title']}]({j['url']}) | {j.get('company', '')} | "
                 f"{j.get('location', '')} | {j.get('salary', '')} | {sig} | {len(j['found_by'])} | "
                 f"{'✓' if j['in_ledger'] else ''} |")
    open(base + ".md", "w").write("\n".join(L) + "\n")
    json.dump({"seed": seed, "run": today, "mode": mode, "days": a.days, "picks": picks,
               "candidates": candidates, "jobs": list(jobs.values())}, open(base + ".json", "w"), indent=2)

    print(f"\n{mode}: {len(picks)} recommended queries, {len(covered)} relevant jobs covered "
          f"({len(jobs)} total, {sum(j['in_ledger'] for j in jobs.values())} already in ledger)")
    for n, c in enumerate(picks, 1):
        print(f"{n}. [{c['precision']:.0%}, +{c['new']}, total {tot(c) or '?'}] {c['query']}  @ {c['location']}")
    if not a.no_qurl and shutil.which("qurl"):
        for n, c in enumerate(picks, 1):
            top = [f"- {jobs[i]['title']} — {jobs[i].get('company', '')} ({jobs[i].get('location', '')})"
                   for i in c["relevant_ids"][:10]]
            body = (f"LinkedIn job search #{n} for roles like {seed['title']} @ {seed['company']}\n"
                    f"Query: {c['query']}\nLocation: {c['location']}\nPrecision: {c['precision']:.0%} "
                    f"({len(c['relevant_ids'])}/{c['returned']}, {mode}) on {today}\nReport: {base}.md\n\n"
                    + "\n".join(top))
            subprocess.run(["qurl", "add", browser_url(c["query"], c["location"], a.days),
                            "--title", f"LinkedIn query #{n}: {c['name']} @ {c['location']} ({seed['company']} seed)",
                            "--tags", f"linkedin-query,{slug}"],
                           input=body, text=True, capture_output=True)
        print(f"Indexed {len(picks)} search URLs in qurl (tag linkedin-query)")
    print(f"\nReport: {base}.md")


if __name__ == "__main__":
    main()
