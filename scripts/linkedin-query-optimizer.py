#!/usr/bin/env python3
"""Find the LinkedIn job-search queries that best surface roles like a seed posting.

Give it a LinkedIn job you'd want (e.g. Perplexity "Member of Technical Staff
(AI Researcher)"). It builds boolean query variants (title group x domain group
x location), runs each against LinkedIn's public guest search, judges every
result title against a relevance profile, and keeps the smallest set of
queries that covers the most relevant jobs. Output: ranked queries with
precision, ready-to-click LinkedIn search URLs, and the relevant jobs found
(flagged when already in leads/pipeline.json).

Why titles, not description jargon: probed 2026-10-05 — LinkedIn's job keyword
search matches titles/companies and fuzzy-expands everything else. "GRPO"
returned GROPYUS (a construction firm), "post-training" returned sales-trainer
jobs, and a nonsense word still returned 10 filler results. So raw hit counts
are meaningless; only judged precision is.

Usage:
  scripts/linkedin-query-optimizer.py https://www.linkedin.com/jobs/view/4468011412/
  scripts/linkedin-query-optimizer.py <url> --locations "Berlin,European Union" --days 14
  scripts/linkedin-query-optimizer.py <url> --pages 1 --max-queries 6   # quick pass

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
NEG = (r"intern\b|internship|werkstudent|student|phd candidate|doktorand|sales|account exec|recruit|"
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


def seed_posting(job_id):
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


def search(keywords, location, days, start, remote=False):
    p = {"keywords": keywords, "location": location, "f_TPR": f"r{days * 86400}", "start": start}
    if remote:
        p["f_WT"] = "2"
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
                "url": f"https://www.linkedin.com/jobs/view/{jid.group(1)}/",
            })
    return out


def relevant(title):
    t = title.lower()
    if re.search(NEG, t):
        return False
    return bool(re.search(ROLE, t)) and bool(re.search(DOMAIN, t) or re.search(STRONG, t))


def build_query(titles, domains, exclude):
    q = "(" + " OR ".join(titles) + ")"
    if domains:
        q += " AND (" + " OR ".join(domains) + ")"
    if exclude:
        q += " NOT " + EXCLUDE
    return q


def browser_url(q, location, days, remote=False):
    p = {"keywords": q, "location": location, "f_TPR": f"r{days * 86400}", "sortBy": "DD"}
    if remote:
        p["f_WT"] = "2"
    return "https://www.linkedin.com/jobs/search/?" + urllib.parse.urlencode(p)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("seed", help="LinkedIn job URL or numeric job id")
    ap.add_argument("--locations", default="Berlin,Germany,European Union")
    ap.add_argument("--days", type=int, default=30, help="posted within N days (f_TPR)")
    ap.add_argument("--pages", type=int, default=2, help="result pages per query (10 results each)")
    ap.add_argument("--max-queries", type=int, default=0, help="cap candidate queries (0 = all)")
    ap.add_argument("--keep", type=int, default=5, help="queries to recommend")
    ap.add_argument("--delay", type=float, default=1.5, help="seconds between requests")
    ap.add_argument("--out", default="leads/linkedin-queries")
    ap.add_argument("--no-qurl", action="store_true", help="don't index recommended search URLs in qurl")
    a = ap.parse_args()

    m = re.search(r"(\d{8,})", a.seed)
    if not m:
        sys.exit("seed must be a LinkedIn job URL or id")
    seed = seed_posting(m.group(1))
    print(f"Seed: {seed['title']} @ {seed['company']} ({seed['location']})", file=sys.stderr)

    locations = [l.strip() for l in a.locations.split(",") if l.strip()]
    candidates = []
    for (tg, titles), (dg, domains), loc in itertools.product(TITLE_GROUPS.items(), DOMAIN_GROUPS.items(), locations):
        # A bare title group ("Member of Technical Staff" alone) drowns in generic SWE roles;
        # only allow it in the narrowest location.
        if dg == "none" and loc != locations[0]:
            continue
        candidates.append({"name": f"{tg}+{dg}", "query": build_query(titles, domains, exclude=True), "location": loc})
    if a.max_queries:
        candidates = candidates[: a.max_queries]

    ledger_text = ""
    if os.path.exists("leads/pipeline.json"):
        ledger_text = open("leads/pipeline.json").read()

    jobs = {}
    for i, c in enumerate(candidates, 1):
        hits = []
        for page in range(a.pages):
            res = search(c["query"], c["location"], a.days, page * 10)
            time.sleep(a.delay)
            if not res:
                break
            hits.extend(res)
        seen = {}
        for h in hits:
            seen.setdefault(h["id"], h)
        rel = [h for h in seen.values() if relevant(h["title"])]
        c["returned"] = len(seen)
        c["relevant_ids"] = [h["id"] for h in rel]
        c["precision"] = round(len(rel) / len(seen), 2) if seen else 0.0
        for h in rel:
            j = jobs.setdefault(h["id"], {**h, "found_by": [], "in_ledger": h["id"] in ledger_text})
            j["found_by"].append(c["name"] + " @ " + c["location"])
        print(f"[{i}/{len(candidates)}] p={c['precision']:.2f} rel={len(rel):2d}/{len(seen):2d}  "
              f"{c['name']} @ {c['location']}", file=sys.stderr)

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
    base = os.path.join(a.out, f"{today}-{slug}")

    L = [f"# LinkedIn queries for roles like: {seed['title']} — {seed['company']}",
         "", f"Seed: https://www.linkedin.com/jobs/view/{seed['id']}/ · run {today} · "
         f"posted ≤{a.days}d · {len(candidates)} candidate queries · {len(jobs)} relevant jobs found",
         "", "## Recommended queries (greedy cover, in order)", "",
         "| # | Query | Location | Precision | New jobs | Open |", "|---|---|---|---|---|---|"]
    for n, c in enumerate(picks, 1):
        L.append(f"| {n} | `{c['query']}` | {c['location']} | {c['precision']:.0%} | {c['new']} | "
                 f"[search]({browser_url(c['query'], c['location'], a.days)}) |")
    L += ["", "## All candidates by precision", "", "| Name | Location | Precision | Relevant/returned |", "|---|---|---|---|"]
    for c in sorted(candidates, key=lambda c: (-c["precision"], -len(c["relevant_ids"]))):
        L.append(f"| {c['name']} | {c['location']} | {c['precision']:.0%} | {len(c['relevant_ids'])}/{c['returned']} |")
    L += ["", "## Relevant jobs found", "", "| Posted | Title | Company | Location | Hits | Ledger |", "|---|---|---|---|---|---|"]
    for j in sorted(jobs.values(), key=lambda j: (-len(j["found_by"]), j["posted"]), reverse=False):
        L.append(f"| {j['posted']} | [{j['title']}]({j['url']}) | {j['company']} | {j['location']} | "
                 f"{len(j['found_by'])} | {'✓' if j['in_ledger'] else ''} |")
    open(base + ".md", "w").write("\n".join(L) + "\n")
    json.dump({"seed": seed, "run": today, "days": a.days, "picks": picks, "candidates": candidates,
               "jobs": list(jobs.values())}, open(base + ".json", "w"), indent=2)

    print(f"\n{len(picks)} recommended queries, {len(covered)} relevant jobs covered "
          f"({len(jobs)} total, {sum(j['in_ledger'] for j in jobs.values())} already in ledger)")
    for n, c in enumerate(picks, 1):
        print(f"{n}. [{c['precision']:.0%}, +{c['new']}] {c['query']}  @ {c['location']}")
        print(f"   {browser_url(c['query'], c['location'], a.days)}")
    if not a.no_qurl and shutil.which("qurl"):
        for n, c in enumerate(picks, 1):
            top = [f"- {jobs[i]['title']} — {jobs[i]['company']} ({jobs[i]['location']})" for i in c["relevant_ids"][:10]]
            body = (f"LinkedIn job search #{n} for roles like {seed['title']} @ {seed['company']}\n"
                    f"Query: {c['query']}\nLocation: {c['location']}\nPrecision: {c['precision']:.0%} "
                    f"({len(c['relevant_ids'])}/{c['returned']}) on {today}\nReport: {base}.md\n\n" + "\n".join(top))
            subprocess.run(["qurl", "add", browser_url(c["query"], c["location"], a.days),
                            "--title", f"LinkedIn query #{n}: {c['name']} @ {c['location']} ({seed['company']} seed)",
                            "--tags", f"linkedin-query,{slug}"],
                           input=body, text=True, capture_output=True)
        print(f"Indexed {len(picks)} search URLs in qurl (tag linkedin-query)")
    print(f"\nReport: {base}.md")


if __name__ == "__main__":
    main()
