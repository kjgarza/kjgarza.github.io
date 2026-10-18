"""find-kristian-jobs/scripts/fetch-job.sh — one fetch chain per ATS, then Jina, then plain HTML.

Response fixtures follow the real API shapes (Greenhouse's `content` is
entity-escaped HTML, verified live 2026-10-18). xfail(strict) tests pin known
bugs: they turn into failures once the bug is fixed, so drop the mark then.
"""
import json, subprocess

import pytest

from conftest import FETCH_JOB

UUID = "0b5ae3f2-6b9e-4c5e-9f0a-1d2c3b4a5f6e"
GH_URL = "https://job-boards.greenhouse.io/examplecorp/jobs/4012345008"
GH_API = "api.greenhouse.io/v1/boards/examplecorp/jobs/4012345008?questions=true"
GH_JOB = {
    "id": 4012345008, "title": "Research Engineer", "location": {"name": "Berlin"},
    "updated_at": "2026-09-01T10:00:00-04:00",
    "content": "&lt;p&gt;Build &amp;amp; ship&lt;/p&gt;",
    "questions": [
        {"label": "Notice period", "required": True,
         "fields": [{"type": "multi_value_single_select", "values": [{"label": "1 month"}, {"label": "3 months"}]}]},
        {"label": "LinkedIn", "required": False, "fields": [{"type": "input_text", "values": []}]},
    ],
}
LEVER_URL = f"https://jobs.lever.co/examplecorp/{UUID}"
LEVER_JOB = {"text": "ML Engineer", "categories": {"location": "London"},
             "createdAt": 1788220800000, "descriptionPlain": "Train models."}  # 2026-09-01T00:00Z
ASHBY_URL = f"https://jobs.ashbyhq.com/examplecorp/{UUID}"
ASHBY_GQL = "jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting"


def ashby(**over):
    posting = {"id": UUID, "title": "AI Engineer", "departmentName": "Engineering", "locationName": "Remote EU",
               "publishedDate": "2026-09-15", "isListed": True, "compensationTierSummary": "€90K – €120K",
               "descriptionHtml": "<p>About</p><ul><li>Ship agents</li><li>Own evals</li></ul><p>Tom &amp; Jerry&#39;s</p>"}
    return {"data": {"jobPosting": {**posting, **over}}}


# ── Greenhouse ────────────────────────────────────────────────────────────────

def test_greenhouse_api(fake_curl):
    fake_curl.route(GH_API, GH_JOB)
    out = fake_curl.json(FETCH_JOB, GH_URL)
    assert (out["url"], out["posted_date"], out["status"]) == (GH_URL, "2026-09-01", "open")
    assert "Research Engineer" in out["content"] and "Location: Berlin" in out["content"]
    assert out["questions"] == [
        {"label": "Notice period", "required": True, "type": "multi_value_single_select", "options": ["1 month", "3 months"]},
        {"label": "LinkedIn", "required": False, "type": "input_text", "options": []},
    ]
    assert [c["url"] for c in fake_curl.calls()] == [f"https://{GH_API}"]


@pytest.mark.xfail(strict=True, reason="BUG: Greenhouse content is entity-escaped; tags survive the strip")
def test_greenhouse_content_is_plain_text(fake_curl):
    fake_curl.route(GH_API, GH_JOB)
    assert "&lt;" not in fake_curl.json(FETCH_JOB, GH_URL)["content"]


@pytest.mark.xfail(strict=True, reason='BUG: header uses "\\n" inside double quotes, which bash leaves literal')
def test_greenhouse_content_header_has_real_newlines(fake_curl):
    fake_curl.route(GH_API, GH_JOB)
    assert fake_curl.json(FETCH_JOB, GH_URL)["content"].startswith("# Research Engineer\nLocation: Berlin\n")


def test_greenhouse_api_miss_falls_through_to_plain_page(fake_curl):
    fake_curl.route(GH_API, "", status=404)
    fake_curl.route(GH_URL, "<h1>Research Engineer</h1><p>Posted: 2026-08-20</p>")
    out = fake_curl.json(FETCH_JOB, GH_URL)
    assert (out["posted_date"], out["status"], out["content"]) == ("2026-08-20", "open", "Research EngineerPosted: 2026-08-20")


# ── Lever ─────────────────────────────────────────────────────────────────────

def test_lever_api(fake_curl):
    fake_curl.route(f"api.lever.co/v0/postings/examplecorp/{UUID}", LEVER_JOB)
    out = fake_curl.json(FETCH_JOB, LEVER_URL)
    assert out["status"] == "open" and "ML Engineer" in out["content"] and "Train models." in out["content"]


def test_lever_closed_text_detected(fake_curl):
    fake_curl.route("api.lever.co/v0/postings/", {**LEVER_JOB, "descriptionPlain": "This position has been filled."})
    assert fake_curl.json(FETCH_JOB, LEVER_URL)["status"] == "closed"


def _bsd_date():
    return subprocess.run(["date", "-d", "@0"], capture_output=True).returncode != 0


@pytest.mark.xfail(_bsd_date(), strict=True, reason="BUG: `date -d @epoch` is GNU-only; macOS/BSD date gives unknown")
def test_lever_posted_date_from_created_at(fake_curl):
    fake_curl.route("api.lever.co/v0/postings/", LEVER_JOB)
    assert fake_curl.json(FETCH_JOB, LEVER_URL)["posted_date"] == "2026-09-01"


# ── Ashby ─────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("url", [ASHBY_URL, f"{ASHBY_URL}/application", f"{ASHBY_URL}/?utm_source=x"])
def test_ashby_queries_one_posting_never_the_board(fake_curl, url):
    fake_curl.route(ASHBY_GQL, ashby())
    out = fake_curl.json(FETCH_JOB, url)
    (call,) = fake_curl.calls()
    assert call["url"] == f"https://{ASHBY_GQL}"
    assert json.loads(call["data"])["variables"] == {"organizationHostedJobsPageName": "examplecorp", "jobPostingId": UUID}
    assert (out["posted_date"], out["status"]) == ("2026-09-15", "open")


def test_ashby_content_is_readable_text(fake_curl):
    fake_curl.route(ASHBY_GQL, ashby())
    content = fake_curl.json(FETCH_JOB, ASHBY_URL)["content"]
    assert content.startswith("# AI Engineer\nLocation: Remote EU\nDepartment: Engineering\n"
                              "Published: 2026-09-15\nCompensation: €90K – €120K\n\n")
    assert "\n- Ship agents\n" in content and "\n- Own evals\n" in content
    assert "Tom & Jerry's" in content and "<" not in content


def test_ashby_optional_lines_dropped_when_empty(fake_curl):
    fake_curl.route(ASHBY_GQL, ashby(departmentName=None, compensationTierSummary=None))
    content = fake_curl.json(FETCH_JOB, ASHBY_URL)["content"]
    assert "Department:" not in content and "Compensation:" not in content


def test_ashby_unlisted_posting_is_closed(fake_curl):
    fake_curl.route(ASHBY_GQL, ashby(isListed=False))
    assert fake_curl.json(FETCH_JOB, ASHBY_URL)["status"] == "closed"


def test_ashby_missing_posting_falls_through(fake_curl):
    fake_curl.route(ASHBY_GQL, {"data": {"jobPosting": None}})
    out = fake_curl.json(FETCH_JOB, ASHBY_URL)
    assert (out["status"], out["content"]) == ("unknown", "")


# ── Jina, plain fallback, failure ─────────────────────────────────────────────

PAGE = "https://careers.example.org/jobs/research-engineer"


def test_jina_used_only_with_api_key(fake_curl):
    fake_curl.route("r.jina.ai/", "# Research Engineer\nPosted April 6, 2026\nApply now")
    fake_curl.route(PAGE, "<p>plain</p>")
    assert fake_curl.json(FETCH_JOB, PAGE)["content"] == "plain"
    out = fake_curl.json(FETCH_JOB, PAGE, env={"JINA_API_KEY": "k"})
    # Free-text dates are passed through as written, not normalised to YYYY-MM-DD.
    assert (out["posted_date"], out["status"]) == ("April 6, 2026", "open")
    assert out["content"].startswith("# Research Engineer")


def test_jina_error_page_falls_back_to_plain(fake_curl):
    fake_curl.route("r.jina.ai/", "Error 429: rate limited")
    fake_curl.route(PAGE, "<p>Research Engineer</p>")
    assert fake_curl.json(FETCH_JOB, PAGE, env={"JINA_API_KEY": "k"})["content"] == "Research Engineer"


@pytest.mark.parametrize("text", ["We are no longer accepting applications", "This position has been filled",
                                  "Position closed", "Job no longer available"])
def test_closed_phrases(fake_curl, text):
    fake_curl.route(PAGE, f"<p>{text}</p>")
    assert fake_curl.json(FETCH_JOB, PAGE)["status"] == "closed"


def test_every_source_failing_still_emits_json(fake_curl):
    assert fake_curl.json(FETCH_JOB, PAGE) == {"url": PAGE, "posted_date": "unknown", "status": "unknown",
                                                "content": "", "questions": []}


# ── batch mode and arguments ──────────────────────────────────────────────────

def test_batch_returns_array_in_argument_order(fake_curl):
    fake_curl.route(GH_API, GH_JOB)
    fake_curl.route(ASHBY_GQL, ashby())
    urls = [PAGE, ASHBY_URL, GH_URL, PAGE + "?2"]
    out = fake_curl.json(FETCH_JOB, "--jobs", "2", *urls)
    assert [o["url"] for o in out] == urls
    assert [o["status"] for o in out] == ["unknown", "open", "open", "unknown"]


@pytest.mark.parametrize("args, msg", [([], "Usage"), (["--jobs", "abc", PAGE], "positive integer"),
                                       (["--jobs", "0", PAGE], "positive integer")])
def test_bad_arguments(fake_curl, args, msg):
    p = fake_curl.run(FETCH_JOB, *args, check=False)
    assert p.returncode == 1 and msg in p.stderr
