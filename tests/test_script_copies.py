"""Skill scripts are copied into several places; .claude/skills is the source of truth.

Every copy listed in SYNCED must stay byte-identical to its canonical file.
STALE lists copies that have already drifted: once one is re-synced (or
deleted) its xfail turns into a failure, so move it to SYNCED.

.agents/skills holds symlinks to .claude/skills, not copies, so it cannot drift.
"""
import pytest

from conftest import REPO

FKJ = ".claude/skills/find-kristian-jobs/scripts"
SYNCED = [
    (".claude/skills/generate-application/scripts/fetch-application-form.sh", f"{FKJ}/fetch-application-form.sh"),
    ("scripts/run-job-search.sh", f"{FKJ}/run-job-search.sh"),
]
STALE = [
    ("scripts/fetch-job.sh", f"{FKJ}/fetch-job.sh"),
]
AGENTS_LINKS = ["find-kristian-jobs", "generate-application", "find-linkedin-contacts"]


@pytest.mark.parametrize("copy, canonical", SYNCED)
def test_copy_matches_canonical(copy, canonical):
    assert (REPO / copy).read_bytes() == (REPO / canonical).read_bytes(), f"{copy} drifted from {canonical}"


@pytest.mark.xfail(strict=True, reason="known drift: re-sync from .claude/skills, then move to SYNCED")
@pytest.mark.parametrize("copy, canonical", STALE)
def test_stale_copy(copy, canonical):
    assert (REPO / copy).read_bytes() == (REPO / canonical).read_bytes()


@pytest.mark.parametrize("skill", AGENTS_LINKS)
def test_agents_skill_is_symlink_to_claude(skill):
    link = REPO / ".agents/skills" / skill
    assert link.is_symlink(), f"{link} must be a symlink to .claude/skills/{skill}, not a copy"
    assert link.resolve() == (REPO / ".claude/skills" / skill).resolve()
