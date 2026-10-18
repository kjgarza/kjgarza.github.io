"""Skill scripts are copied into several places; .claude/skills is the source of truth.

Every copy listed in SYNCED must stay byte-identical to its canonical file.
STALE lists copies that have already drifted: once one is re-synced (or
deleted) its xfail turns into a failure, so move it to SYNCED.
"""
import pytest

from conftest import REPO

FKJ = ".claude/skills/find-kristian-jobs/scripts"
SYNCED = [
    (".claude/skills/generate-application/scripts/fetch-application-form.sh", f"{FKJ}/fetch-application-form.sh"),
    (".agents/skills/generate-application/scripts/fetch-application-form.sh", f"{FKJ}/fetch-application-form.sh"),
    ("scripts/run-job-search.sh", f"{FKJ}/run-job-search.sh"),
    (".agents/skills/find-kristian-jobs/scripts/run-job-search.sh", f"{FKJ}/run-job-search.sh"),
]
STALE = [
    ("scripts/fetch-job.sh", f"{FKJ}/fetch-job.sh"),
    (".agents/skills/find-kristian-jobs/scripts/fetch-job.sh", f"{FKJ}/fetch-job.sh"),
    (".agents/skills/find-kristian-jobs/scripts/fetch-application-form.sh", f"{FKJ}/fetch-application-form.sh"),
]


@pytest.mark.parametrize("copy, canonical", SYNCED)
def test_copy_matches_canonical(copy, canonical):
    assert (REPO / copy).read_bytes() == (REPO / canonical).read_bytes(), f"{copy} drifted from {canonical}"


@pytest.mark.xfail(strict=True, reason="known drift: re-sync from .claude/skills, then move to SYNCED")
@pytest.mark.parametrize("copy, canonical", STALE)
def test_stale_copy(copy, canonical):
    assert (REPO / copy).read_bytes() == (REPO / canonical).read_bytes()
