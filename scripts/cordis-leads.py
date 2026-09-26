#!/usr/bin/env python3
"""Mine CORDIS + the EU Funding & Tenders Portal for outreach targets.

Finds EU-funded (Horizon Europe) projects at the intersection of AI and
research infrastructure / scholarly publishing / research integrity /
research data / research intelligence, then ranks the *organisations* that
keep winning that money. Also lists open calls (incl. cascade-funding calls
run by projects) in the same space, since consortia form around them.

Why organisations, not projects: staff budgets are fixed at grant signature
and most hiring happens in a project's first ~9 months. Repeat winners have a
pipeline of grants; recent starts are where hiring happens now.

Usage:
  scripts/cordis-leads.py                    # writes to leads/cordis/
  scripts/cordis-leads.py --country DE,NL    # restrict organisations
  scripts/cordis-leads.py --no-calls         # skip the Funding portal
  scripts/cordis-leads.py --refresh          # re-download the CORDIS dump

Stdlib only. The ~36 MB CORDIS dump is cached in ~/.cache/cordis-leads/.
"""
import argparse, collections, csv, datetime as dt, io, json, os, re, ssl, sys
import urllib.parse, urllib.request, zipfile

# api.tech.ec.europa.eu chains to GlobalSign Root R46, which macOS's
# /etc/ssl/cert.pem lacks; certifi's bundle has it. Fall back to system roots.
try:
    import certifi
    TLS = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    TLS = ssl.create_default_context()

DUMP_URL = "https://cordis.europa.eu/data/cordis-HORIZONprojects-csv.zip"
SEDIA_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/search"
CACHE = os.path.expanduser(os.environ.get("CORDIS_CACHE", "~/.cache/cordis-leads"))
HIRING_WINDOW_DAYS = 270  # "recent start" = started within ~9 months

# Domain terms, weighted by how specific they are to the research-ecosystem
# niche (vs. generic mentions in any project's data-management boilerplate).
STRONG = {
    "publishing": r"scholarly (communication|publishing)|academic publishing|research publishing|diamond open access|open access (publishing|books|journals|monograph)|preprints?\b|scholarly (record|literature|infrastructure)",
    "integrity": r"research integrity|research misconduct|paper mills?|scientific integrity|research security",
    "assessment": r"research (assessment|evaluation|intelligence|information system|management|analytics)|\bcris\b|bibliometric|scientometric|science of science|responsible metrics|\bcoara\b",
    "pids": r"persistent identifiers?|\bpids?\b|\borcid\b|\bror\b|\bdois?\b|datacite|crossref",
    "eosc": r"\beosc\b|european open science cloud|open (scholarly|research) infrastructure|open infrastructure",
    "kg": r"(research|scholarly|scientific|open research) knowledge graphs?|openaire",
}
MEDIUM = {
    "openscience": r"\bopen science\b|open research\b",
    "data": r"\bfair (data|principles|digital objects|research)|research data (management|infrastructure|repositor|sharing|services)|data stewardship|research software",
    "kg_generic": r"knowledge graphs?",
    "metadata": r"\bmetadata\b",
    "peer": r"peer review|reproducibility|replicability",
}
AI_RE = re.compile(r"artificial intelligence|machine learning|\bai\b|large language models?|\bllms?\b|natural language processing|\bnlp\b|text mining|generative|foundation models?|semantic search", re.I)
CORE_LEGAL_BASIS = {"HORIZON.4.2": 3, "HORIZON.1.3": 1}  # R&I system reform; research infrastructures
# Individual fellowships / ERC / EIC equity don't hire outside staff for this niche.
EXCLUDED_SCHEMES = {"HORIZON-TMA-MSCA-PF-EF", "HORIZON-TMA-MSCA-PF-GF", "HORIZON-ERC",
                    "HORIZON-ERC-POC", "HORIZON-ERC-SYG", "HORIZON-EIC-ACC-BF"}
MIN_SCORE = 5
ORG_TYPES = {"PRC": "company", "REC": "research org", "HES": "university", "PUB": "public body", "OTH": "other/non-profit"}
FLEXIBLE_HIRERS = {"company", "other/non-profit"}  # hire/contract without formal public postings
CALL_PAGES_MAX = 30  # 100 per page; ~1,200 open/forthcoming calls as of 2026-09

_compile = lambda d: {k: re.compile(v, re.I) for k, v in d.items()}
STRONG_RE, MEDIUM_RE = _compile(STRONG), _compile(MEDIUM)


def log(*a):
    print(*a, file=sys.stderr)


def fetch_dump(refresh):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, "cordis-HORIZONprojects-csv.zip")
    fresh = os.path.exists(path) and (dt.datetime.now().timestamp() - os.path.getmtime(path)) < 7 * 86400
    if refresh or not fresh:
        log(f"downloading {DUMP_URL} …")
        with urllib.request.urlopen(DUMP_URL, timeout=300, context=TLS) as r, open(path + ".part", "wb") as f:
            f.write(r.read())
        os.replace(path + ".part", path)
    return path


def read_csv(zf, name):
    csv.field_size_limit(10**9)
    with zf.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="utf-8"), delimiter=";")


def eur(s):
    try:
        return float((s or "0").replace(",", "."))
    except ValueError:
        return 0.0


def score_text(text, weight):
    """Return (score, matched tags) for one text field."""
    score, tags = 0, set()
    for table, pts in ((STRONG_RE, 3), (MEDIUM_RE, 1)):
        for tag, rx in table.items():
            if rx.search(text):
                score += pts * weight
                tags.add(tag)
    return score, tags


def relevance(head, body, bonus=0, body_strong_needed=1):
    """Score a title/keywords + body pair. Returns (score, tags, ai)."""
    head_score, head_tags = score_text(head, 2)
    body_score, body_tags = score_text(body, 1)
    score = head_score + body_score + bonus
    # Body-only hits on generic terms are boilerplate (every Horizon text says
    # "FAIR" and "open science"; every work programme topic mentions EOSC).
    if not head_tags and len(body_tags & STRONG.keys()) < body_strong_needed:
        score = min(score, MIN_SCORE - 1)
    return score, sorted(head_tags | body_tags), bool(AI_RE.search(f"{head} {body}"))


def score_project(p, legal_bases, ai_vocab):
    bonus = sum(CORE_LEGAL_BASIS.get(lb, 0) for lb in legal_bases)
    if "EOSC" in p["topics"] or "-ERA-" in p["topics"]:
        bonus += 3
    score, tags, ai = relevance(f"{p['title']} {p['keywords']}", p["objective"], bonus)
    return score, tags, ai or ai_vocab


def stage(p, today):
    start = dt.date.fromisoformat(p["startDate"]) if p["startDate"] else None
    end = dt.date.fromisoformat(p["endDate"]) if p["endDate"] else None
    if p["status"] != "SIGNED" or (end and end < today):
        return "ended"
    if start and start > today:
        return "starting"
    if start and (today - start).days <= HIRING_WINDOW_DAYS:
        return "hiring-window"
    return "running"


def analyse_cordis(zip_path, today, countries):
    zf = zipfile.ZipFile(zip_path)
    names = {os.path.basename(n): n for n in zf.namelist()}
    legal = collections.defaultdict(set)
    for r in read_csv(zf, names["legalBasis.csv"]):
        legal[r["projectID"]].add(r["legalBasis"])
    ai_vocab = {r["projectID"] for r in read_csv(zf, names["euroSciVoc.csv"])
                if "artificial intelligence" in r["euroSciVocPath"]}

    projects = {}
    for p in read_csv(zf, names["project.csv"]):
        if p["fundingScheme"] in EXCLUDED_SCHEMES:
            continue
        score, tags, ai = score_project(p, legal[p["id"]], p["id"] in ai_vocab)
        if score < MIN_SCORE:
            continue
        projects[p["id"]] = {
            "id": p["id"], "acronym": p["acronym"], "title": p["title"], "score": score + (3 if ai else 0),
            "ai": ai, "tags": ";".join(tags), "stage": stage(p, today), "start": p["startDate"],
            "end": p["endDate"], "ec_eur": eur(p["ecMaxContribution"]), "scheme": p["fundingScheme"],
            "topic": p["topics"], "coordinator": "", "url": f"https://cordis.europa.eu/project/id/{p['id']}",
        }

    orgs = {}
    for o in read_csv(zf, names["organization.csv"]):
        p = projects.get(o["projectID"])
        if not p:
            continue
        if o["role"] == "coordinator":
            p["coordinator"] = o["name"]
        if countries and o["country"] not in countries:
            continue
        key = o["organisationID"] or o["name"]
        g = orgs.setdefault(key, {
            "name": o["name"], "short": o["shortName"], "country": o["country"], "city": o["city"],
            "type": ORG_TYPES.get(o["activityType"], o["activityType"]), "sme": o["SME"] == "true",
            "url": o["organizationURL"], "active": 0, "recent": 0, "past": 0, "coordinated": 0,
            "ai_projects": 0, "ec_active_eur": 0.0, "project_ids": {},
        })
        live = p["stage"] != "ended"
        if live:
            g["ec_active_eur"] += eur(o["ecContribution"])
        g["coordinated"] += o["role"] == "coordinator"
        g["url"] = g["url"] or o["organizationURL"]
        if p["id"] in g["project_ids"]:  # same org listed twice (e.g. as linked third party)
            continue
        g["project_ids"][p["id"]] = p
        g["active" if live else "past"] += 1
        g["recent"] += p["stage"] in ("hiring-window", "starting")
        g["ai_projects"] += p["ai"]

    stage_order = {"starting": 0, "hiring-window": 1, "running": 2, "ended": 3}
    for g in orgs.values():
        # Recent starts are hiring now; active grants mean budget; past grants mean
        # a track record (they'll bid again). Companies/non-profits hire flexibly.
        g["score"] = (4 * g["recent"] + 2 * g["active"] + g["past"] + 2 * g["coordinated"]
                      + 2 * g["ai_projects"] + (3 if g["type"] in FLEXIBLE_HIRERS else 0)
                      + round(g["ec_active_eur"] / 500_000))
        ps = sorted(g.pop("project_ids").values(), key=lambda p: (stage_order[p["stage"]], -p["score"]))
        g["projects"] = " ".join(f"{p['acronym']}({p['stage']})" for p in ps)
    return projects, orgs


def sedia(text, page):
    query = {"bool": {"must": [{"terms": {"type": ["1", "2", "8"]}},
                               {"terms": {"status": ["31094501", "31094502"]}}]}}
    boundary = "cordisleads"
    body = "".join(
        f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\nContent-Type: application/json\r\n\r\n{v}\r\n'
        for k, v in (("query", json.dumps(query)), ("languages", '["en"]'))) + f"--{boundary}--\r\n"
    url = f"{SEDIA_URL}?apiKey=SEDIA&text={urllib.parse.quote(text)}&pageSize=100&pageNumber={page}"
    req = urllib.request.Request(url, data=body.encode(), method="POST",
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=60, context=TLS) as r:
        return json.load(r)


def first(md, key):
    v = md.get(key)
    return (v[0] if isinstance(v, list) and v else v) or ""


def fetch_calls(today):
    """Open/forthcoming calls. The portal's status labels are stale (calls
    marked 'open' with 2022 deadlines), so filter on the deadline ourselves."""
    # Free-text search only matches titles, so pull every open/forthcoming call
    # and score it locally, the same way as projects.
    calls, seen = {}, 0
    for page in range(1, CALL_PAGES_MAX + 1):
        res = sedia("***", page).get("results", [])
        seen += len(res)
        for r in res:
            md = r.get("metadata", {})
            upcoming = sorted(d[:10] for d in (md.get("deadlineDate") or []) if d and d[:10] >= today.isoformat())
            if not upcoming:
                continue
            head = f"{first(md, 'title')} {first(md, 'callTitle')} {first(md, 'destinationDescription')}"
            body = re.sub(r"<[^>]+>", " ", " ".join(
                str(first(md, k)) for k in ("descriptionByte", "description", "furtherInformation")))
            score, tags, ai = relevance(head, body, body_strong_needed=2)
            if score < MIN_SCORE:
                continue
            ident = first(md, "identifier")
            kind = {"1": "topic", "2": "call", "8": "cascade (project-run)"}.get(first(md, "type"), "?")
            if kind == "topic":
                url = f"https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/{ident}"
            else:
                url = first(md, "url") or r.get("url", "")
                if first(md, "projectAcronym"):
                    ident = f"{first(md, 'projectAcronym')}: {ident}"
            calls[ident] = {"id": ident, "title": first(md, "title") or first(md, "callTitle"), "kind": kind,
                            "deadline": upcoming[0], "score": score + (3 if ai else 0), "ai": ai,
                            "tags": ";".join(tags), "url": url}
        if len(res) < 100:
            break
    log(f"calls: scanned {seen}, kept {len(calls)}")
    return calls


def write_csv(path, rows, fields):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="leads/cordis")
    ap.add_argument("--country", help="comma-separated ISO codes to keep organisations from, e.g. DE,NL")
    ap.add_argument("--no-calls", action="store_true")
    ap.add_argument("--refresh", action="store_true")
    ap.add_argument("--top", type=int, default=30)
    a = ap.parse_args()

    today = dt.date.today()
    countries = set(a.country.upper().split(",")) if a.country else set()
    os.makedirs(a.out, exist_ok=True)
    stamp = today.isoformat()

    projects, orgs = analyse_cordis(fetch_dump(a.refresh), today, countries)
    calls = {} if a.no_calls else fetch_calls(today)

    P = sorted(projects.values(), key=lambda p: (p["stage"] == "ended", -p["score"]))
    O = sorted((g for g in orgs.values() if g["active"]), key=lambda g: -g["score"])
    C = sorted(calls.values(), key=lambda c: (-c["score"], c["deadline"]))
    write_csv(f"{a.out}/{stamp}-projects.csv", P, list(P[0].keys()) if P else ["id"])
    write_csv(f"{a.out}/{stamp}-organisations.csv", O, ["score", "name", "short", "type", "sme", "country", "city",
              "recent", "active", "past", "coordinated", "ai_projects", "ec_active_eur", "url", "projects"])
    write_csv(f"{a.out}/{stamp}-calls.csv", C, ["score", "deadline", "kind", "id", "title", "tags", "url"])

    by_stage = collections.Counter(p["stage"] for p in P)
    hiring = [p for p in P if p["stage"] in ("hiring-window", "starting")]
    md = [f"# CORDIS lead scan — {stamp}", "",
          f"Relevant Horizon Europe projects: **{len(P)}** ({', '.join(f'{k}: {v}' for k, v in by_stage.most_common())}). "
          f"Organisations with active relevant grants: **{len(O)}**"
          + (f" (countries: {','.join(sorted(countries))})" if countries else "") + ". "
          + (f"Open/upcoming calls: **{len(C)}**." if not a.no_calls else "Calls: skipped."),
          "", "Stages: *hiring-window* = started ≤9 months ago, *starting* = signed, not yet started. "
          "Recent/Active/Past = relevant projects in the hiring window or starting / not ended / ended."]

    def org_table(title, rows):
        md.extend(["", title, "",
                   "| # | Score | Organisation | Type | Country | Recent/Active/Past | AI | Active EC € | Projects |",
                   "|---|---|---|---|---|---|---|---|---|"])
        for i, g in enumerate(rows, 1):
            name = f"[{g['name']}]({g['url']})" if g["url"] else g["name"]
            md.append(f"| {i} | {g['score']} | {name} | {g['type']}{' (SME)' if g['sme'] else ''} | {g['country']} | "
                      f"{g['recent']}/{g['active']}/{g['past']} | {g['ai_projects']} | {g['ec_active_eur']:,.0f} | {g['projects'][:140]} |")

    org_table(f"## Companies and non-profits — best cold-outreach targets (top {a.top})",
              [g for g in O if g["type"] in FLEXIBLE_HIRERS][:a.top])
    org_table(f"## All organisations (top {a.top})", O[:a.top])
    md += ["", f"## Projects in the hiring window ({len(hiring)})", "",
           "| Score | Project | Stage | Start → End | EC € | AI | Coordinator | Tags |", "|---|---|---|---|---|---|---|---|"]
    for p in hiring[:a.top]:
        md.append(f"| {p['score']} | [{p['acronym']}]({p['url']}) — {p['title'][:70]} | {p['stage']} | {p['start']} → {p['end']} | "
                  f"{p['ec_eur']:,.0f} | {'yes' if p['ai'] else ''} | {p['coordinator']} | {p['tags']} |")
    if not a.no_calls:
        md += ["", f"## Open and upcoming calls ({len(C)})", "",
               "Consortia bid on these now — getting named as expert/subcontractor is the lever. "
               "*Cascade* calls are run by funded projects that have money to give out.", "",
               "| Score | Deadline | Kind | Call | Tags |", "|---|---|---|---|---|"]
        for c in C[:a.top]:
            md.append(f"| {c['score']} | {c['deadline']} | {c['kind']} | [{c['id']}]({c['url']}) — {c['title'][:80]} | {c['tags']} |")
    md += ["", f"Full data: `{stamp}-organisations.csv`, `{stamp}-projects.csv`"
           + ("" if a.no_calls else f", `{stamp}-calls.csv`") + ".", ""]
    report = f"{a.out}/{stamp}-cordis-leads.md"
    with open(report, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(json.dumps({"report": report, "projects": len(P), "stages": dict(by_stage),
                      "organisations": len(O), "calls": len(C)}))


if __name__ == "__main__":
    main()
