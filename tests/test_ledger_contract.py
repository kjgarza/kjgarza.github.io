"""Contract checks against the real leads/pipeline.json — local only.

The ledger holds personal job-search data and lives outside this public repo,
so nothing from it is committed: these tests read it at run time and skip when
it is absent (CI, fresh clones). Point $PIPELINE_LEDGER at a copy to override.
They pin what the scripts rely on, across every entry the pipeline has written.
"""
import json, os, re, shutil, sys
from pathlib import Path
from urllib.parse import urlparse

import pytest

from conftest import REPO, load_script

STORE = Path(os.environ.get("EMPLOYMENT_JOBS_DIR", "/Volumes/Verbatim-Vi560-Media/Development/employment-jobs"))
LEDGER = Path(os.environ.get("PIPELINE_LEDGER", STORE / "leads" / "pipeline.json"))
pytestmark = pytest.mark.skipif(not LEDGER.is_file(), reason=f"no local ledger at {LEDGER}")

FIELDS = {"company", "role", "score", "recommendation", "status", "discovered", "posted_date",
          "deadline", "package", "answers", "contacts", "notes"}
RECOMMENDATIONS = ("PASS", "NOTIFY-ONLY", "GO", "STRETCH", "AUTO-PREPARE")
ISO = re.compile(r"\d{4}-\d{2}-\d{2}")
ATS_HOSTS = {"greenhouse.io": "greenhouse", "ashbyhq.com": "ashby", "lever.co": "lever"}


@pytest.fixture(scope="module")
def ledger():
    return json.loads(LEDGER.read_text())


@pytest.fixture(scope="module")
def jobs(ledger):
    return ledger["jobs"]


def documented_statuses():
    """The status list in job-pipeline/SKILL.md, the schema the ledger follows."""
    text = (REPO / ".claude/skills/job-pipeline/SKILL.md").read_text()
    line = next(l for l in text.splitlines() if l.startswith("- Keyed by job URL. Statuses:"))
    return set(re.findall(r"`?\b([a-z]+)\b`?", line.split("Statuses:")[1])) - {"terminal"}


def test_top_level_shape(ledger):
    assert {"jobs", "updated"} <= set(ledger) and ISO.fullmatch(ledger["updated"])


def test_every_entry_has_every_field(jobs):
    missing = {url: sorted(FIELDS - set(j)) for url, j in jobs.items() if FIELDS - set(j)}
    assert not missing


def test_statuses_are_documented_and_cover_check_postings():
    cp = load_script("check-postings")
    assert cp.PRE_SUBMIT | cp.POST_SUBMIT <= documented_statuses()


def test_every_status_is_documented(jobs):
    assert {j["status"] for j in jobs.values()} <= documented_statuses()


def test_recommendations_use_policy_actions(jobs):
    assert not [j["recommendation"] for j in jobs.values() if not j["recommendation"].startswith(RECOMMENDATIONS)]


def test_keys_are_clean_urls_or_recruiter_refs(jobs):
    bad = [u for u in jobs if not (u.startswith("https://") or u.startswith("recruiter:"))
           or re.search(r"[?&](utm_|gh_src|lever-source)", u)]
    assert not bad


def test_dates(jobs):
    for url, j in jobs.items():
        assert ISO.fullmatch(j["discovered"]), url
        assert j.get("updated") is None or ISO.fullmatch(j["updated"]), url
        assert j["deadline"] is None or ISO.fullmatch(j["deadline"]), url
        # posted_date may carry a note, e.g. "2026-09-21 (Greenhouse updated_at)"
        assert j["posted_date"] is None or ISO.match(j["posted_date"]) or j["posted_date"].startswith("unknown"), url


def test_packages_exist_on_disk(jobs):
    missing = [j["package"] for j in jobs.values() if j["package"] and not (STORE / j["package"]).is_dir()]
    assert not missing


def test_prepared_packages_have_application_questions(jobs):
    """CLAUDE.md: every package must include application-questions.md (enforced for live pre-submit work)."""
    active = [j for j in jobs.values() if j["status"] in {"prepared", "notified", "approved"}]
    assert not [j["package"] for j in active
                if not j["answers"] or not (STORE / j["package"] / "application-questions.md").is_file()]


def test_every_ats_url_reaches_its_api_in_check_postings(jobs, monkeypatch):
    """A Greenhouse/Ashby/Lever URL that falls through to page scraping loses the reliable verdict."""
    cp = load_script("check-postings")
    for name in ("greenhouse", "ashby", "lever", "page"):
        monkeypatch.setattr(cp, f"check_{name}", lambda *a, n=name: (n, ""))
    for url, j in jobs.items():
        host = urlparse(url).netloc
        want = next((ch for h, ch in ATS_HOSTS.items() if host.endswith(h)), None)
        got = cp.check(url, j["role"], False)[0]
        assert got == (want or ("page" if url.startswith("http") else "N/A")), url


def test_check_postings_dry_run_over_the_real_ledger(jobs, monkeypatch, tmp_path, capsys):
    cp = load_script("check-postings")
    copy = tmp_path / "pipeline.json"
    shutil.copy(LEDGER, copy)
    before = copy.read_bytes()
    monkeypatch.setattr(cp, "check", lambda url, role, b: ("OPEN", "stub"))
    monkeypatch.setattr(sys, "argv", ["check-postings.py", "--ledger", str(copy)])
    assert cp.main() == 0
    active = sum(j["status"] in cp.PRE_SUBMIT | cp.POST_SUBMIT for j in jobs.values())
    assert f"{active} active entries checked; dry run" in capsys.readouterr().out
    assert copy.read_bytes() == before
