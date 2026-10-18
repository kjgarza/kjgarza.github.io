"""fetch-application-form.sh — apply deep link + questions per ATS, and the needs_browser handoff."""
import json

import pytest

from conftest import FETCH_FORM

UUID = "0b5ae3f2-6b9e-4c5e-9f0a-1d2c3b4a5f6e"
GH_URL = "https://job-boards.greenhouse.io/examplecorp/jobs/4012345008"


def test_greenhouse_full_form_from_api(fake_curl):
    fake_curl.route("boards-api.greenhouse.io/v1/boards/examplecorp/jobs/4012345008?questions=true", {
        "id": 4012345008, "absolute_url": GH_URL,
        "questions": [{"label": "Resume/CV", "required": True, "fields": [{"type": "input_file", "values": []}]},
                      {"label": "Visa?", "required": True,
                       "fields": [{"type": "multi_value_single_select", "values": [{"label": "Yes"}, {"label": "No"}]}]}],
        "compliance": [{"questions": [{"label": "Gender", "required": False, "type": "select",
                                       "answer_options": [{"label": "Decline"}]}]}],
        "demographic_questions": {"questions": [{"label": "", "required": False}]},
    })
    out = fake_curl.json(FETCH_FORM, GH_URL)
    assert (out["ats"], out["apply_url"], out["source"], out["needs_browser"]) == ("greenhouse", GH_URL + "#app", "api", False)
    assert out["questions"] == [
        {"label": "Resume/CV", "type": "input_file", "required": True, "options": None},
        {"label": "Visa?", "type": "multi_value_single_select", "required": True, "options": ["Yes", "No"]},
        {"label": "Gender", "type": "select", "required": None, "options": ["Decline"]},  # see xfail below
    ]


def test_greenhouse_eu_host_tried_first(fake_curl):
    fake_curl.run(FETCH_FORM, "https://job-boards.eu.greenhouse.io/examplecorp/jobs/1")
    hosts = [c["url"].split("/")[2] for c in fake_curl.calls()]
    assert hosts[:3] == ["boards-api.eu.greenhouse.io", "boards-api.greenhouse.io", "api.greenhouse.io"]


def test_greenhouse_api_down_reads_the_page_and_asks_for_a_browser(fake_curl):
    fake_curl.route(GH_URL, "<h1>Research Engineer</h1><p>About the role</p>")
    out = fake_curl.json(FETCH_FORM, GH_URL)
    assert (out["source"], out["questions"], out["needs_browser"]) == ("apply-page", [], True)
    assert "Research Engineer" in out["form_text"]


def test_lever_labels_from_server_rendered_apply_page(fake_curl):
    fake_curl.route(f"jobs.lever.co/examplecorp/{UUID}/apply", """
      <label class="q">Full name</label><label>Why us?</label>
      <input aria-label="Current company"><input placeholder="LinkedIn URL"><label>Why us?</label>""")
    out = fake_curl.json(FETCH_FORM, f"https://jobs.lever.co/examplecorp/{UUID}/?lever-source=x")
    assert (out["ats"], out["apply_url"], out["source"], out["needs_browser"]) == \
        ("lever", f"https://jobs.lever.co/examplecorp/{UUID}/apply", "apply-page", False)
    assert sorted(q["label"] for q in out["questions"]) == ["Current company", "Full name", "LinkedIn URL", "Why us?"]


def test_ashby_form_from_graphql(fake_curl):
    fake_curl.route("jobs.ashbyhq.com/api/non-user-graphql", {"data": {"jobPosting": {"applicationForm": {"sections": [
        {"fieldEntries": [{"isRequired": True, "field": {"title": "Name", "type": "String"}},
                          {"isRequired": False, "field": {"title": "Notice", "type": "ValueSelect",
                                                          "selectableValues": [{"label": "1 month", "value": "1"}]}}]}]}}}})
    out = fake_curl.json(FETCH_FORM, f"https://jobs.ashbyhq.com/examplecorp/{UUID}/application")
    assert (out["apply_url"], out["source"], out["needs_browser"]) == \
        (f"https://jobs.ashbyhq.com/examplecorp/{UUID}/application", "api", False)
    assert out["questions"] == [{"label": "Name", "type": "String", "required": True, "options": None},
                                {"label": "Notice", "type": "ValueSelect", "required": None, "options": ["1 month"]}]
    assert json.loads(fake_curl.calls()[0]["data"])["variables"]["jobPostingId"] == UUID


@pytest.mark.xfail(strict=True, reason="BUG: jq `.required // null` turns false into null, so optional reads as unknown")
@pytest.mark.parametrize("url, route, body", [
    (GH_URL, "boards-api.greenhouse.io/", {"id": 1, "questions": [{"label": "Pronouns", "required": False}]}),
    (f"https://jobs.ashbyhq.com/examplecorp/{UUID}", "non-user-graphql", {"data": {"jobPosting": {"applicationForm": {
        "sections": [{"fieldEntries": [{"isRequired": False, "field": {"title": "Pronouns", "type": "String"}}]}]}}}}),
])
def test_optional_questions_keep_required_false(fake_curl, url, route, body):
    fake_curl.route(route, body)
    assert fake_curl.json(FETCH_FORM, url)["questions"][0]["required"] is False


@pytest.mark.parametrize("env, source, text", [({}, "none", ""), ({"JINA_API_KEY": "k"}, "apply-page", "Rendered form")])
def test_ashby_api_failure_degrades(fake_curl, env, source, text):
    fake_curl.route("r.jina.ai/", "Rendered form")
    out = fake_curl.json(FETCH_FORM, f"https://jobs.ashbyhq.com/examplecorp/{UUID}", env=env)
    assert (out["source"], out["form_text"], out["needs_browser"]) == (source, text, True)


def test_workable_form_api(fake_curl):
    fake_curl.route("apply.workable.com/api/v3/accounts/examplecorp/jobs/AB12CD/form",
                    {"fields": [{"key": "name", "label": "Name", "type": "text", "required": True}],
                     "questions": [{"body": "Salary?", "type": "free_text", "required": False}]})
    out = fake_curl.json(FETCH_FORM, "https://apply.workable.com/examplecorp/j/AB12CD/")
    assert (out["ats"], out["apply_url"], out["source"]) == \
        ("workable", "https://apply.workable.com/examplecorp/j/AB12CD/apply/", "api")
    assert [q["label"] for q in out["questions"]] == ["Name", "Salary?"]


def test_factorial_always_hands_off_to_browser(fake_curl):
    url = "https://examplecorp.factorialhr.com/job_posting/ai-engineer-123"
    fake_curl.route(url, "<h1>AI Engineer</h1>")
    out = fake_curl.json(FETCH_FORM, url + "?ref=x")
    assert (out["ats"], out["apply_url"], out["source"], out["needs_browser"]) == ("factorial", url, "none", True)
    assert "AI Engineer" in out["form_text"]


@pytest.mark.parametrize("href, apply_url", [
    ("/jobs/42/apply", "https://careers.example.org/jobs/42/apply"),
    ("https://ats.example.net/application/42", "https://ats.example.net/application/42"),
    ("//ats.example.net/apply/42", "https://ats.example.net/apply/42"),
])
def test_generic_follows_the_apply_link(fake_curl, href, apply_url):
    url = "https://careers.example.org/jobs/42"
    fake_curl.route(apply_url, '<label>Cover letter</label>')
    fake_curl.route(url, f'<link href="/static/apply.css"><a href="{href}">Apply</a>')
    out = fake_curl.json(FETCH_FORM, url)
    assert (out["ats"], out["apply_url"], out["questions"][0]["label"]) == ("generic", apply_url, "Cover letter")


def test_generic_without_apply_link_returns_page_text(fake_curl):
    url = "https://careers.example.org/jobs/42"
    fake_curl.route(url, "<p>Email jobs@example.org</p>")
    out = fake_curl.json(FETCH_FORM, url)
    assert (out["apply_url"], out["source"], out["form_text"].strip(), out["needs_browser"]) == \
        (url, "none", "Email jobs@example.org", True)


def test_missing_url_is_an_error(fake_curl):
    assert fake_curl.run(FETCH_FORM, check=False).returncode == 1
