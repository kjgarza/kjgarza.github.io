"""find-kristian-jobs/scripts/fetch-board.sh — every board API mapped to one job schema."""
import pytest

from conftest import FETCH_BOARD

KEYS = {"title", "location", "posted_date", "url", "apply_url", "remote", "listed", "department"}


def test_ashby_board(fake_curl):
    fake_curl.route("api.ashbyhq.com/posting-api/job-board/examplecorp?includeCompensation=true", {"jobs": [
        {"title": "AI Engineer", "location": "Berlin", "publishedAt": "2026-09-15T08:00:00.000+00:00",
         "jobUrl": "https://jobs.ashbyhq.com/examplecorp/1", "applyUrl": "https://jobs.ashbyhq.com/examplecorp/1/application",
         "workplaceType": "Remote", "isListed": True, "department": "Engineering", "team": "Agents"},
        {"title": "Zombie", "jobUrl": "https://jobs.ashbyhq.com/examplecorp/2", "isRemote": False, "isListed": False},
    ]})
    out = fake_curl.json(FETCH_BOARD, "ashby", "examplecorp")
    assert (out["ats"], out["board"], out["count"]) == ("ashby", "examplecorp", 2)
    a, z = out["jobs"]
    assert set(a) == KEYS
    assert a == {"title": "AI Engineer", "location": "Berlin", "posted_date": "2026-09-15",
                 "url": "https://jobs.ashbyhq.com/examplecorp/1", "apply_url": "https://jobs.ashbyhq.com/examplecorp/1/application",
                 "remote": True, "listed": True, "department": "Engineering / Agents"}
    assert (z["posted_date"], z["apply_url"], z["remote"], z["listed"], z["location"], z["department"]) == \
        ("unknown", "https://jobs.ashbyhq.com/examplecorp/2", False, False, "", "")


def test_greenhouse_board(fake_curl):
    fake_curl.route("boards-api.greenhouse.io/v1/boards/examplecorp/jobs", {"jobs": [
        {"title": "Research Engineer", "location": {"name": "London"}, "updated_at": "2026-09-01T10:00:00-04:00",
         "absolute_url": "https://job-boards.greenhouse.io/examplecorp/jobs/1"}]})
    (job,) = fake_curl.json(FETCH_BOARD, "greenhouse", "examplecorp")["jobs"]
    assert job == {"title": "Research Engineer", "location": "London", "posted_date": "2026-09-01",
                   "url": "https://job-boards.greenhouse.io/examplecorp/jobs/1",
                   "apply_url": "https://job-boards.greenhouse.io/examplecorp/jobs/1",
                   "remote": None, "listed": True, "department": ""}


def test_lever_board(fake_curl):
    fake_curl.route("api.lever.co/v0/postings/examplecorp?mode=json", [
        {"text": "ML Engineer", "categories": {"location": "Paris", "team": "Research"}, "createdAt": 1788220800000,
         "hostedUrl": "https://jobs.lever.co/examplecorp/1", "applyUrl": "https://jobs.lever.co/examplecorp/1/apply"},
        {"text": "No date", "categories": {}, "hostedUrl": "https://jobs.lever.co/examplecorp/2"}])
    a, b = fake_curl.json(FETCH_BOARD, "lever", "examplecorp")["jobs"]
    assert (a["posted_date"], a["location"], a["department"], a["apply_url"]) == \
        ("2026-09-01", "Paris", "Research", "https://jobs.lever.co/examplecorp/1/apply")
    assert (b["posted_date"], b["apply_url"]) == ("unknown", "https://jobs.lever.co/examplecorp/2")


@pytest.mark.parametrize("ats", ["ashby", "greenhouse", "lever"])
@pytest.mark.parametrize("body, status", [("", 404), ("<html>not json</html>", 200), ('{"unexpected": 1}', 200)])
def test_board_failures_return_empty_result_not_an_error(fake_curl, ats, body, status):
    fake_curl.route("", body, status=status)
    out = fake_curl.json(FETCH_BOARD, ats, "nope")
    assert out == {"ats": ats, "board": "nope", "count": 0, "jobs": [], "error": "board not found or API unreachable"}


GOOGLE_PAGE = """
[Research Engineer](https://www.google.com/about/careers/applications/jobs/results/1234567-research-engineer-gemini?q=x)
[Research Engineer again](https://www.google.com/about/careers/applications/jobs/results/1234567-research-engineer-gemini)
[Staff SWE](https://www.google.com/about/careers/applications/jobs/results/7654321-staff-software-engineer-ai)
"""


def test_google_harvests_unique_posting_links_in_page_order(fake_curl):
    fake_curl.route("r.jina.ai/", GOOGLE_PAGE)
    out = fake_curl.json(FETCH_BOARD, "google", 'machine "learning"', "Berlin Germany", env={"JINA_API_KEY": "k"})
    assert [j["title"] for j in out["jobs"]] == ["research engineer gemini", "staff software engineer ai"]
    assert out["jobs"][0]["url"] == "https://www.google.com/about/careers/applications/jobs/results/1234567-research-engineer-gemini"
    assert {j["posted_date"] for j in out["jobs"]} == {"unknown"} and out["jobs"][0]["location"] == "Berlin Germany"
    (call,) = fake_curl.calls()
    assert call["url"].endswith("?q=machine%20%22learning%22&sort_by=date&location=Berlin%20Germany")


@pytest.mark.parametrize("env, page, error", [
    ({}, GOOGLE_PAGE, "JINA_API_KEY required for google mode"),
    ({"JINA_API_KEY": "k"}, None, "Jina Reader returned nothing"),
    ({"JINA_API_KEY": "k"}, "no links here", "no postings matched (or page layout changed)"),
])
def test_google_failures(fake_curl, env, page, error):
    if page is not None:
        fake_curl.route("r.jina.ai/", page)
    out = fake_curl.json(FETCH_BOARD, "google", 'say "hi"', env=env)
    assert out["error"] == error and out["board"] == 'say "hi"'  # quotes survive into valid JSON


@pytest.mark.parametrize("args", [[], ["ashby"], ["workday", "x"]])
def test_bad_arguments(fake_curl, args):
    assert fake_curl.run(FETCH_BOARD, *args, check=False).returncode == 1
