"""scripts/check-postings.py — verdicts per channel and what --apply does to the ledger.

Network is replaced at the http() / check() seam; URL shapes mirror the ones
in leads/pipeline.json (see test_ledger_contract.py for the live-data checks).
"""
import json, subprocess, sys

import pytest

from conftest import REPO

UUID = "0b5ae3f2-6b9e-4c5e-9f0a-1d2c3b4a5f6e"


# ── routing ───────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("url, channel, args", [
    ("https://job-boards.greenhouse.io/examplecorp/jobs/4012345008", "greenhouse", ("examplecorp", "4012345008")),
    ("https://boards.greenhouse.io/examplecorp/jobs/4012345008?gh_src=x", "greenhouse", ("examplecorp", "4012345008")),
    ("https://job-boards.eu.greenhouse.io/examplecorp/jobs/4012345008", "greenhouse", ("examplecorp", "4012345008")),
    ("https://boards.greenhouse.io/embed/job_app?for=examplecorp/jobs/4012345008", "greenhouse", ("examplecorp", "4012345008")),
    (f"https://jobs.ashbyhq.com/examplecorp/{UUID}", "ashby", ("examplecorp", UUID)),
    (f"https://jobs.ashbyhq.com/examplecorp/{UUID}/application", "ashby", ("examplecorp", UUID)),
    (f"https://jobs.lever.co/examplecorp/{UUID}", "lever", ("examplecorp", UUID)),
    (f"https://jobs.lever.co/examplecorp/{UUID}/apply", "lever", ("examplecorp", UUID)),
    ("https://examplecorp.wd3.myworkdayjobs.com/en-US/Careers/job/Berlin/Engineer_R123", "page", None),
    ("https://www.example.org/careers/research-engineer", "page", None),
])
def test_routes_each_url_shape_to_its_channel(check_postings, monkeypatch, url, channel, args):
    seen = []
    for name in ("greenhouse", "ashby", "lever"):
        monkeypatch.setattr(check_postings, f"check_{name}", lambda *a, n=name: seen.append((n, a)) or ("OPEN", n))
    monkeypatch.setattr(check_postings, "check_page", lambda u, r, b: seen.append(("page", None)) or ("OPEN", "page"))
    check_postings.check(url, "Engineer", False)
    assert seen == [(channel, args)]


def test_non_url_entry_is_not_applicable(check_postings):
    assert check_postings.check("recruiter:examplecorp-head-of-ai", "Head of AI", False) == \
        ("N/A", "no public posting (recruiter-led)")


# ── ATS APIs ──────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("status, verdict", [(200, "OPEN"), (404, "CLOSED"), (500, "UNKNOWN"), (None, "UNKNOWN")])
@pytest.mark.parametrize("fn", ["check_greenhouse", "check_lever"])
def test_single_posting_apis_map_status_codes(check_postings, monkeypatch, fn, status, verdict):
    monkeypatch.setattr(check_postings, "http", lambda url: (status, "URLError: boom" if status is None else ""))
    assert getattr(check_postings, fn)("examplecorp", "123")[0] == verdict


def test_unknown_reason_carries_the_network_error(check_postings, monkeypatch):
    monkeypatch.setattr(check_postings, "http", lambda url: (None, "URLError: timed out"))
    assert check_postings.check_greenhouse("x", "1") == ("UNKNOWN", "Greenhouse API URLError: timed out")


def test_ashby_fetches_each_board_once_and_matches_by_id(check_postings, monkeypatch):
    calls = []
    board = {"jobs": [{"id": "a"}, {"id": "b"}]}
    monkeypatch.setattr(check_postings, "http", lambda url: calls.append(url) or (200, json.dumps(board)))
    assert check_postings.check_ashby("examplecorp", "a")[0] == "OPEN"
    assert check_postings.check_ashby("examplecorp", "zzz")[0] == "CLOSED"
    assert calls == ["https://api.ashbyhq.com/posting-api/job-board/examplecorp"]


def test_ashby_board_failure_is_unknown_not_closed(check_postings, monkeypatch):
    monkeypatch.setattr(check_postings, "http", lambda url: (503, ""))
    assert check_postings.check_ashby("examplecorp", "a") == ("UNKNOWN", "Ashby API 503")


# ── page fallback ─────────────────────────────────────────────────────────────

@pytest.fixture
def raw_only(check_postings, monkeypatch):
    """No scrape-core on PATH: only the raw-HTML source runs."""
    monkeypatch.setattr(check_postings.shutil, "which", lambda _: None)
    def serve(status, body=""):
        monkeypatch.setattr(check_postings, "http", lambda url: (status, body))
    return serve


def test_page_open_when_role_title_core_is_present(check_postings, raw_only):
    raw_only(200, "<h1>Forward Deployed Engineer</h1><script>var x='no longer accepting'</script>")
    assert check_postings.check_page("https://x.test/j", "Forward Deployed Engineer / AI implementations", False) == \
        ("OPEN", '"forward deployed engineer" on page (raw)')


@pytest.mark.parametrize("role, core", [
    ("Senior Engineer - Platform", "senior engineer"),
    ("Staff Engineer, Search", "staff engineer"),
    ("Data Scientist (m/f/d)", "data scientist"),
    ("Engineering Manager | Data", "engineering manager"),
])
def test_page_matches_title_core_before_separators(check_postings, raw_only, role, core):
    raw_only(200, f"<p>We are hiring a {core.title()}!</p>")
    assert check_postings.check_page("https://x.test/j", role, False)[0] == "OPEN"


def test_page_closed_phrase_wins_over_title(check_postings, raw_only):
    raw_only(200, "<h1>Research Engineer</h1><p>This job is no longer accepting applications</p>")
    assert check_postings.check_page("https://x.test/j", "Research Engineer", False) == \
        ("CLOSED", 'page says "no longer accepting" (raw)')


def test_page_without_title_is_only_likely_closed(check_postings, raw_only):
    raw_only(200, "<h1>Careers</h1><p>Research and engineering at Example</p>")
    assert check_postings.check_page("https://x.test/j", "Research Engineer", False)[0] == "LIKELY_CLOSED"


def test_page_unknown_when_every_source_fails(check_postings, raw_only):
    raw_only(403)
    verdict, why = check_postings.check_page("https://x.test/j", "Research Engineer", False)
    assert verdict == "UNKNOWN" and "scrape-core not on PATH" in why and "raw HTTP 403" in why


def test_page_tries_scrape_core_tiers_in_order_then_raw(check_postings, monkeypatch):
    tiers = []
    def run(cmd, **kw):
        tiers.append(next(a for a in cmd if a.startswith("--tiers=")))
        return subprocess.CompletedProcess(cmd, 0, json.dumps({"title": "Careers", "content": "nothing"}), "")
    monkeypatch.setattr(check_postings.shutil, "which", lambda _: "/bin/scrape-core")
    monkeypatch.setattr(check_postings.subprocess, "run", run)
    monkeypatch.setattr(check_postings, "http", lambda url: (200, "<p>Research Engineer</p>"))
    assert check_postings.check_page("https://x.test/j", "Research Engineer", True) == \
        ("OPEN", '"research engineer" on page (raw)')
    assert tiers == ["--tiers=plain", "--tiers=jina", "--tiers=browser"]


# ── main(): selection, --apply, report, exit codes ───────────────────────────

def job(status, notes="", role="Engineer"):
    return {"company": f"Co-{status}", "role": role, "status": status, "notes": notes}


@pytest.fixture
def run_main(check_postings, monkeypatch, tmp_path, capsys):
    ledger_path = tmp_path / "pipeline.json"

    def run(jobs, verdicts, *flags):
        """jobs: {url: job}; verdicts: {url: verdict}. Returns (code, ledger, stdout, stderr, checked)."""
        if not ledger_path.exists():
            ledger_path.write_text(json.dumps({"updated": "2026-01-01", "jobs": jobs}))
        checked = []
        monkeypatch.setattr(check_postings, "check",
                            lambda url, role, b: checked.append(url) or (verdicts[url], f"why-{verdicts[url]}"))
        monkeypatch.setattr(sys, "argv", ["check-postings.py", "--ledger", str(ledger_path), *flags])
        code = check_postings.main()
        out = capsys.readouterr()
        return code, json.loads(ledger_path.read_text()), out.out, out.err, checked
    return run


ALL_STATUSES = ["discovered", "scored", "preparing", "prepared", "notified", "approved",
                "submitted", "interviewing", "rejected", "passed", "expired"]


def test_only_active_statuses_are_checked(run_main):
    jobs = {f"https://x.test/{s}": job(s) for s in ALL_STATUSES}
    _, _, _, _, checked = run_main(jobs, {u: "OPEN" for u in jobs})
    assert sorted(u.rsplit("/", 1)[1] for u in checked) == \
        sorted(["prepared", "notified", "approved", "submitted", "interviewing"])


def test_dry_run_leaves_ledger_untouched(run_main, tmp_path):
    jobs = {"https://x.test/a": job("prepared")}
    run_main(jobs, {"https://x.test/a": "CLOSED"})
    before = (tmp_path / "pipeline.json").read_text()
    code, ledger, out, err, _ = run_main(jobs, {"https://x.test/a": "CLOSED"})
    assert (tmp_path / "pipeline.json").read_text() == before
    assert ledger["jobs"]["https://x.test/a"]["status"] == "prepared"
    assert "dry run, ledger untouched" in out
    assert "CHANGE\tExpired before submission: Co-prepared — Engineer" in err  # still reported
    assert code == 0


@pytest.mark.parametrize("status", ["prepared", "notified", "approved"])
def test_apply_expires_closed_pre_submit_jobs(run_main, status):
    code, ledger, _, _, _ = run_main({"https://x.test/a": job(status, notes="keep me")},
                                     {"https://x.test/a": "CLOSED"}, "--apply")
    row = ledger["jobs"]["https://x.test/a"]
    assert row["status"] == "expired"
    assert row["notes"].startswith("keep me | ") and "posting-check: posting closed (why-CLOSED)" in row["notes"]
    assert "no decision received" not in row["notes"]
    assert row["updated"] == ledger["updated"] != "2026-01-01"


@pytest.mark.parametrize("status", ["submitted", "interviewing"])
def test_apply_notes_closed_post_submit_jobs_once_without_changing_status(run_main, status):
    url = "https://x.test/a"
    _, ledger, _, err, _ = run_main({url: job(status)}, {url: "CLOSED"}, "--apply")
    row = ledger["jobs"][url]
    assert row["status"] == status
    assert row["notes"].endswith("posting closed (why-CLOSED); no decision received")
    assert f"CHANGE\tPosting closed, still {status}" in err
    # Second run: the note is already there, so nothing changes or is reported.
    _, again, _, err2, _ = run_main({}, {url: "CLOSED"}, "--apply")
    assert again["jobs"][url]["notes"] == row["notes"]
    assert "CHANGE" not in err2


@pytest.mark.parametrize("verdict", ["OPEN", "LIKELY_CLOSED", "UNKNOWN", "N/A"])
def test_apply_never_acts_on_anything_but_closed(run_main, tmp_path, verdict):
    jobs = {"https://x.test/a": job("prepared"), "https://x.test/b": job("submitted")}
    run_main(jobs, dict.fromkeys(jobs, verdict), "--apply")
    assert json.loads((tmp_path / "pipeline.json").read_text())["jobs"] == jobs


def test_likely_closed_is_flagged_for_a_human(run_main):
    _, _, out, err, _ = run_main({"https://x.test/a": job("prepared")}, {"https://x.test/a": "LIKELY_CLOSED"})
    assert "LIKELY_CLOSED rows were not applied" in out
    assert "CHECK\tCo-prepared — Engineer: why-LIKELY_CLOSED" in err


def test_unknown_makes_the_run_degraded(run_main):
    jobs = {"https://x.test/a": job("prepared"), "https://x.test/b": job("prepared")}
    code, *_ = run_main(jobs, {"https://x.test/a": "OPEN", "https://x.test/b": "UNKNOWN"})
    assert code == 1


def test_report_is_sorted_by_verdict_and_written(run_main, tmp_path):
    verdicts = {f"https://x.test/{i}": v for i, v in enumerate(["OPEN", "N/A", "UNKNOWN", "CLOSED", "LIKELY_CLOSED"])}
    jobs = {u: job("prepared") for u in verdicts}
    report = tmp_path / "report.md"
    _, _, out, _, _ = run_main(jobs, verdicts, "--report", str(report))
    rows = [l.split(" | ")[0].lstrip("| ") for l in out.splitlines() if l.startswith("| ") and "Verdict" not in l]
    assert rows == ["CLOSED", "LIKELY_CLOSED", "UNKNOWN", "OPEN", "N/A"]
    assert report.read_text() + "\n" == out  # print() adds one newline
    assert "5 active entries checked" in out


def test_no_changes_reported_as_none(run_main):
    _, _, out, _, _ = run_main({"https://x.test/a": job("prepared")}, {"https://x.test/a": "OPEN"})
    assert out.rstrip().endswith("## Changes\n- None")


def test_unreadable_ledger_is_a_setup_error(tmp_path):
    p = subprocess.run([sys.executable, "-I", str(REPO / "scripts" / "check-postings.py"),
                        "--ledger", str(tmp_path / "missing.json")], capture_output=True, text=True)
    assert p.returncode == 2 and "cannot read ledger" in p.stderr
