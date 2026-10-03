#!/usr/bin/env python3
"""Check whether every active job in leads/pipeline.json is still open.

Deterministic, no LLM. Covers prepared/notified/approved (where a closed posting
means a missed opportunity) and submitted/interviewing (where a closed posting
with no decision means the application has likely gone cold).

Verdicts:
  OPEN           ATS API lists the job, or the page still shows the role title.
  CLOSED         ATS API says it is gone (404 / not on the board), or the page
                 says so explicitly ("no longer accepting", ...). Actionable.
  LIKELY_CLOSED  Non-ATS page loads but the role title is gone (e.g. redirect to
                 a generic careers page). Reported, never applied automatically.
  UNKNOWN        The check itself failed. A failed channel is not evidence.

With --apply:
  prepared/notified/approved + CLOSED -> status "expired", note appended.
  submitted/interviewing + CLOSED     -> note appended once, status unchanged
                                         (a closed posting is not a rejection).

Usage:
  scripts/check-postings.py [--ledger PATH] [--apply] [--report PATH] [--browser]
Exit: 0 ok, 1 some checks UNKNOWN (degraded), 2 setup error.
"""
import argparse, datetime, html, json, re, shutil, subprocess, sys, urllib.error, urllib.request

DEFAULT_LEDGER = "/Volumes/Verbatim-Vi560-Media/Development/employment-jobs/leads/pipeline.json"
PRE_SUBMIT = {"prepared", "notified", "approved"}
POST_SUBMIT = {"submitted", "interviewing"}
CLOSED_PHRASES = ("no longer accepting", "no longer available", "position has been filled",
                  "this job is no longer", "job not found", "posting has closed", "job has expired")
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) check-postings"}
_ashby_cache = {}


def http(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
            return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:  # network failure -> caller reports UNKNOWN
        return None, f"{type(e).__name__}: {e}"


def check_greenhouse(board, jid):
    s, b = http(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{jid}")
    if s == 200: return "OPEN", "Greenhouse API 200"
    if s == 404: return "CLOSED", "Greenhouse API 404"
    return "UNKNOWN", f"Greenhouse API {s or b}"


def check_ashby(org, jid):
    if org not in _ashby_cache:
        s, b = http(f"https://api.ashbyhq.com/posting-api/job-board/{org}")
        _ashby_cache[org] = {j["id"] for j in json.loads(b)["jobs"]} if s == 200 else f"Ashby API {s or b}"
    ids = _ashby_cache[org]
    if isinstance(ids, str): return "UNKNOWN", ids
    return ("OPEN", "on Ashby board") if jid in ids else ("CLOSED", "not on Ashby board")


def check_lever(org, jid):
    s, b = http(f"https://api.lever.co/v0/postings/{org}/{jid}")
    if s == 200: return "OPEN", "Lever API 200"
    if s == 404: return "CLOSED", "Lever API 404"
    return "UNKNOWN", f"Lever API {s or b}"


def check_page(url, role, browser):
    """Non-ATS page via scrape-core (handles JS pages and rate limits via Jina)."""
    # Core of the title, e.g. "Forward Deployed Engineer / AI implementations"
    # -> "forward deployed engineer". Matched as a phrase: word overlap passes
    # on any careers page that says "research" and "engineer" somewhere.
    core = norm(re.split(r"\s+[-–—/|]\s+|[,(]", role)[0])
    # One source at a time, cheapest first. Readability (plain) and Jina both
    # drop collapsed listing sections (Zeta Alpha's Wix page), so the raw HTML
    # goes last, and "title missing" only counts once every source missed it.
    sources = ["plain", "jina"] + (["browser"] if browser else []) + ["raw"]
    tried, errors = [], []
    for src in sources:
        if src == "raw":
            s, body = http(url)
            if s != 200:
                errors.append(f"raw HTTP {s}"); continue
            body = re.sub(r"<script.*?</script>|<style.*?</style>", " ", body, flags=re.S)
            text = norm(html.unescape(re.sub(r"<[^>]+>", " ", body)))
        else:
            if not shutil.which("scrape-core"):
                errors.append("scrape-core not on PATH"); continue
            p = subprocess.run(["scrape-core", url, "--json", f"--tiers={src}", "--timeout=30000"],
                               capture_output=True, text=True, timeout=120)
            if p.returncode != 0:
                errors.append(f"{src} exit {p.returncode}"); continue
            d = json.loads(p.stdout)
            text = norm(d.get("title", "") + " " + d.get("content", ""))
        tried.append(src)
        hit = next((ph for ph in CLOSED_PHRASES if ph in text), None)
        if hit: return "CLOSED", f'page says "{hit}" ({src})'
        if core in text:
            return "OPEN", f'"{core}" on page ({src})'
    if not tried:
        return "UNKNOWN", "every fetch failed: " + ", ".join(errors)
    return "LIKELY_CLOSED", f'"{core}" not on page ({"+".join(tried)})'


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[*_`#\[\]]", "", s.lower())).strip()


def check(url, role, browser):
    if m := re.search(r"greenhouse\.io/(?:embed/job_app\?for=)?([\w-]+)/jobs/(\d+)", url):
        return check_greenhouse(*m.groups())
    if m := re.search(r"ashbyhq\.com/([^/]+)/([0-9a-f-]{36})", url):
        return check_ashby(*m.groups())
    if m := re.search(r"lever\.co/([^/]+)/([0-9a-f-]{36})", url):
        return check_lever(*m.groups())
    if url.startswith("http"):
        return check_page(url, role, browser)
    return "N/A", "no public posting (recruiter-led)"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ledger", default=DEFAULT_LEDGER)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--report")
    ap.add_argument("--browser", action="store_true", help="add scrape-core's Playwright tier")
    a = ap.parse_args()

    try:
        ledger = json.load(open(a.ledger))
    except Exception as e:
        print(f"cannot read ledger: {e}", file=sys.stderr); return 2
    today = datetime.date.today().isoformat()
    rows, changes = [], []

    for url, job in ledger["jobs"].items():
        st = job.get("status")
        if st not in PRE_SUBMIT | POST_SUBMIT: continue
        verdict, why = check(url, job.get("role", ""), a.browser)
        rows.append((st, job.get("company"), job.get("role"), verdict, why, url))
        if verdict != "CLOSED": continue
        stamp = f"{today} posting-check: posting closed ({why})"
        if st in PRE_SUBMIT:
            changes.append(f"Expired before submission: {job.get('company')} — {job.get('role')}")
            if a.apply:
                job["status"] = "expired"
        elif "posting closed" in (job.get("notes") or ""):
            continue  # already noted (by an earlier run or a manual reconcile)
        else:
            stamp += "; no decision received"
            changes.append(f"Posting closed, still {st}: {job.get('company')} — {job.get('role')}")
        if a.apply:
            job["notes"] = (job.get("notes") + " | " if job.get("notes") else "") + stamp
            job["updated"] = today

    if a.apply and changes:
        ledger["updated"] = today
        with open(a.ledger, "w") as f:
            json.dump(ledger, f, indent=2, ensure_ascii=False); f.write("\n")

    order = {"CLOSED": 0, "LIKELY_CLOSED": 1, "UNKNOWN": 2, "OPEN": 3, "N/A": 4}
    rows.sort(key=lambda r: (order[r[3]], r[0]))
    unknown = sum(r[3] == "UNKNOWN" for r in rows)
    md = [f"# Posting check — {today}", "",
          f"{len(rows)} active entries checked; {'applied' if a.apply else 'dry run, ledger untouched'}.", "",
          "| Verdict | Status | Company | Role | Evidence |", "|---|---|---|---|---|"]
    md += [f"| {v} | {st} | {c} | [{r}]({u}) | {w} |" for st, c, r, v, w, u in rows]
    md += ["", "## Changes", *([f"- {c}" for c in changes] or ["- None"])]
    if any(r[3] == "LIKELY_CLOSED" for r in rows):
        md += ["", "LIKELY_CLOSED rows were not applied — confirm by eye."]
    out = "\n".join(md) + "\n"
    if a.report:
        open(a.report, "w").write(out)
    print(out)
    # Machine-readable tail for the notifier wrapper: one change per line.
    for c in changes: print("CHANGE\t" + c, file=sys.stderr)
    for r in rows:
        if r[3] == "LIKELY_CLOSED": print(f"CHECK\t{r[1]} — {r[2]}: {r[4]}", file=sys.stderr)
    return 1 if unknown else 0


if __name__ == "__main__":
    sys.exit(main())
