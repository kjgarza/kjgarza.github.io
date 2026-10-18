"""scripts/cordis-leads.py — relevance scoring, project stages, organisation ranking.

Runs against a tiny synthetic CORDIS dump in the real CSV layout (';'-delimited,
files inside a folder in the zip); the Funding & Tenders API is stubbed.
"""
import csv, datetime as dt, io, json, sys, zipfile

import pytest

TODAY = dt.date(2026, 10, 18)

PROJECT_COLS = ["id", "acronym", "title", "keywords", "objective", "topics", "fundingScheme",
                "status", "startDate", "endDate", "ecMaxContribution"]
ORG_COLS = ["projectID", "organisationID", "name", "shortName", "country", "city", "activityType",
            "SME", "organizationURL", "role", "ecContribution"]


def csv_bytes(cols, rows):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=cols, delimiter=";")
    w.writeheader()
    w.writerows([{c: r.get(c, "") for c in cols} for r in rows])
    return buf.getvalue()


def project(pid, title="Open research knowledge graph for scholarly publishing", start="2026-06-01",
            end="2029-05-31", status="SIGNED", scheme="HORIZON-RIA", topics="HORIZON-WIDERA-2025-ERA-01", **kw):
    return {"id": pid, "acronym": f"P{pid}", "title": title, "keywords": "", "objective": kw.pop("objective", ""),
            "topics": topics, "fundingScheme": scheme, "status": status, "startDate": start, "endDate": end,
            "ecMaxContribution": "1000000,0", **kw}


def org(pid, oid, name, role="participant", country="DE", kind="PRC", ec="250000,0"):
    return {"projectID": pid, "organisationID": oid, "name": name, "shortName": name[:4], "country": country,
            "city": "Berlin", "activityType": kind, "SME": "true", "organizationURL": f"https://{oid}.test",
            "role": role, "ecContribution": ec}


@pytest.fixture
def dump(tmp_path):
    def make(projects, orgs, legal=(), ai=()):
        path = tmp_path / "cordis.zip"
        with zipfile.ZipFile(path, "w") as z:
            z.writestr("csv/project.csv", csv_bytes(PROJECT_COLS, projects))
            z.writestr("csv/organization.csv", csv_bytes(ORG_COLS, orgs))
            z.writestr("csv/legalBasis.csv", csv_bytes(["projectID", "legalBasis"],
                                                       [{"projectID": p, "legalBasis": lb} for p, lb in legal]))
            z.writestr("csv/euroSciVoc.csv", csv_bytes(["projectID", "euroSciVocPath"],
                       [{"projectID": p, "euroSciVocPath": "/natural sciences/computer and information sciences/artificial intelligence"} for p in ai]))
        return str(path)
    return make


# ── scoring ───────────────────────────────────────────────────────────────────

def test_strong_terms_score_three_medium_one_times_weight(cordis):
    assert cordis.score_text("research integrity and metadata", 2) == (8, {"integrity", "metadata"})
    assert cordis.score_text("nothing relevant", 2) == (0, set())


def test_body_only_boilerplate_is_capped_below_threshold(cordis):
    body = "We follow FAIR data principles, open science, peer review and metadata standards."
    score, tags, _ = cordis.relevance("Battery chemistry", body)
    assert score == cordis.MIN_SCORE - 1 and tags == ["data", "metadata", "openscience", "peer"]


def test_one_strong_body_term_lifts_the_cap_for_projects_but_calls_need_two(cordis):
    body = "We build research data infrastructure, publish preprints and use FAIR principles and metadata."
    assert cordis.relevance("Battery chemistry", body)[0] >= cordis.MIN_SCORE
    assert cordis.relevance("Battery chemistry", body, body_strong_needed=2)[0] == cordis.MIN_SCORE - 1


def test_head_hit_is_never_capped(cordis):
    # kg strong (3*2) + kg_generic medium (1*2)
    assert cordis.relevance("Scholarly knowledge graphs", "")[0] == 8


@pytest.mark.parametrize("text, ai", [("large language models for review", True), ("an NLP pipeline", True),
                                      ("the aim of the project", False), ("generative design", True)])
def test_ai_detection(cordis, text, ai):
    assert cordis.relevance(text, "")[2] is ai


@pytest.mark.parametrize("s, v", [("1234,5", 1234.5), ("", 0.0), (None, 0.0), ("n/a", 0.0), ("42", 42.0)])
def test_eur_parses_cordis_decimal_commas(cordis, s, v):
    assert cordis.eur(s) == v


@pytest.mark.parametrize("p, stage", [
    (dict(status="TERMINATED"), "ended"),
    (dict(end="2026-10-17"), "ended"),
    (dict(start="2026-11-01"), "starting"),
    (dict(start=(TODAY - dt.timedelta(days=270)).isoformat()), "hiring-window"),
    (dict(start=(TODAY - dt.timedelta(days=271)).isoformat()), "running"),
    (dict(start=""), "running"),
])
def test_stage(cordis, p, stage):
    assert cordis.stage(project("1", **p), TODAY) == stage


# ── analyse_cordis ────────────────────────────────────────────────────────────

def test_projects_filtered_scored_and_tagged(cordis, dump):
    projects, _ = cordis.analyse_cordis(dump(
        [project("1"), project("2", title="Battery chemistry", topics="HORIZON-CL5"),
         project("3", scheme="HORIZON-ERC")],
        [org("1", "o1", "Acme GmbH", role="coordinator")],
        legal=[("1", "HORIZON.4.2")], ai=["1"]), TODAY, set())
    assert list(projects) == ["1"]  # 2 irrelevant, 3 excluded scheme
    p = projects["1"]
    # head: publishing+kg strong (2*3*2=12) + kg_generic+openscience medium (2*1*2=4);
    # ERA topic +3; HORIZON.4.2 +3; AI (euroSciVoc) +3
    assert (p["score"], p["ai"], p["stage"], p["coordinator"]) == (25, True, "hiring-window", "Acme GmbH")
    assert p["tags"] == "kg;kg_generic;openscience;publishing"


def test_organisations_ranked_with_dedup_and_country_filter(cordis, dump):
    projects = [project("1"), project("2", start="2020-01-01", end="2023-12-31")]
    orgs = [org("1", "o1", "Acme GmbH", role="coordinator"),
            org("1", "o1", "Acme GmbH", ec="50000,0"),        # listed twice on one project
            org("2", "o1", "Acme GmbH"),
            org("1", "o2", "Uni Paris", country="FR", kind="HES")]
    _, all_orgs = cordis.analyse_cordis(dump(projects, orgs), TODAY, set())
    acme = all_orgs["o1"]
    assert (acme["recent"], acme["active"], acme["past"], acme["coordinated"]) == (1, 1, 1, 1)
    assert acme["ec_active_eur"] == 300000.0  # both listings on the live project, none from the ended one
    # 4*recent + 2*active + past + 2*coordinated + 2*ai + 3 (company) + round(ec/500k)
    assert acme["score"] == 4 + 2 + 1 + 2 + 0 + 3 + 1
    assert acme["projects"] == "P1(hiring-window) P2(ended)"
    assert all_orgs["o2"]["type"] == "university"

    _, de_only = cordis.analyse_cordis(dump(projects, orgs), TODAY, {"DE"})
    assert set(de_only) == {"o1"}


# ── calls ─────────────────────────────────────────────────────────────────────

def call(ident, deadlines, kind="1", title="Research integrity and paper mills", **md):
    return {"metadata": {"identifier": [ident], "title": [title], "type": [kind], "deadlineDate": deadlines, **md}}


def test_calls_keep_relevant_upcoming_and_build_urls(cordis, monkeypatch):
    pages = {1: [call("TOPIC-1", ["2026-12-01T17:00:00.000+0000"]),
                 call("OLD-1", ["2022-01-01T00:00:00.000+0000"]),
                 call("OFF-1", ["2026-12-01"], title="Battery chemistry"),
                 call("CASC-1", ["2026-11-15", "2027-03-01"], kind="8", url=["https://casc.test"], projectAcronym=["OPENX"])]}
    seen = []
    monkeypatch.setattr(cordis, "sedia", lambda text, page: seen.append(page) or {"results": pages.get(page, [])})
    calls = cordis.fetch_calls(TODAY)
    assert seen == [1]  # short page ends pagination
    assert set(calls) == {"TOPIC-1", "OPENX: CASC-1"}
    assert calls["TOPIC-1"]["url"].endswith("/topic-details/TOPIC-1")
    assert calls["TOPIC-1"]["deadline"] == "2026-12-01"
    assert (calls["OPENX: CASC-1"]["kind"], calls["OPENX: CASC-1"]["url"], calls["OPENX: CASC-1"]["deadline"]) == \
        ("cascade (project-run)", "https://casc.test", "2026-11-15")


# ── main ──────────────────────────────────────────────────────────────────────

def test_main_writes_report_and_csvs(cordis, dump, monkeypatch, tmp_path, capsys):
    today = dt.date.today()
    zip_path = dump([project("1", start=(today - dt.timedelta(days=30)).isoformat(),
                             end=(today + dt.timedelta(days=900)).isoformat())],
                    [org("1", "o1", "Acme GmbH", role="coordinator")])
    monkeypatch.setattr(cordis, "fetch_dump", lambda refresh: zip_path)
    monkeypatch.setattr(cordis, "sedia", lambda *a: pytest.fail("--no-calls must not hit the portal"))
    out = tmp_path / "out"
    monkeypatch.setattr(sys, "argv", ["cordis-leads.py", "--out", str(out), "--no-calls"])
    cordis.main()
    summary = json.loads(capsys.readouterr().out)
    assert summary == {"report": f"{out}/{today}-cordis-leads.md", "projects": 1,
                       "stages": {"hiring-window": 1}, "organisations": 1, "calls": 0}
    assert sorted(p.name for p in out.iterdir()) == sorted(
        f"{today}-{n}" for n in ["calls.csv", "cordis-leads.md", "organisations.csv", "projects.csv"])
    report = (out / f"{today}-cordis-leads.md").read_text()
    assert "[Acme GmbH](https://o1.test)" in report and "Calls: skipped." in report
