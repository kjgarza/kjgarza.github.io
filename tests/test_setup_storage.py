"""scripts/setup-storage.sh — leads/ and applications/ symlinks into external storage."""
import json, os, shutil, stat, subprocess, sys

import pytest

from conftest import REPO


@pytest.fixture
def repo(tmp_path):
    """A throwaway repo root holding a copy of the script (it links relative to itself)."""
    (tmp_path / "repo" / "scripts").mkdir(parents=True)
    shutil.copy(REPO / "scripts" / "setup-storage.sh", tmp_path / "repo" / "scripts")
    return tmp_path / "repo"


def setup(repo, store):
    return subprocess.run(["bash", str(repo / "scripts" / "setup-storage.sh")], capture_output=True, text=True,
                          env={**os.environ, "EMPLOYMENT_JOBS_DIR": str(store)})


def test_creates_private_storage_seed_ledger_and_links(repo, tmp_path):
    store = tmp_path / "store"
    p = setup(repo, store)
    assert p.returncode == 0, p.stderr
    for name in ("leads", "applications"):
        assert os.readlink(repo / name) == str(store / name)
        assert stat.S_IMODE((store / name).stat().st_mode) == 0o700
    assert json.loads((store / "leads" / "pipeline.json").read_text()) == {}
    assert p.stdout.splitlines() == [f"leads -> {store}/leads", f"applications -> {store}/applications"]


def test_rerun_is_idempotent_and_keeps_the_ledger(repo, tmp_path):
    store = tmp_path / "store"
    setup(repo, store)
    (store / "leads" / "pipeline.json").write_text('{"jobs": {"u": {}}}')
    assert setup(repo, store).returncode == 0
    assert (store / "leads" / "pipeline.json").read_text() == '{"jobs": {"u": {}}}'


def test_relinks_to_a_new_location(repo, tmp_path):
    setup(repo, tmp_path / "a")
    setup(repo, tmp_path / "b")
    assert os.readlink(repo / "leads") == str(tmp_path / "b" / "leads")


def test_refuses_to_replace_a_real_directory(repo, tmp_path):
    (repo / "leads").mkdir()
    (repo / "leads" / "pipeline.json").write_text("{}")
    p = setup(repo, tmp_path / "store")
    assert p.returncode == 1 and "is not a symlink" in p.stderr
    assert (repo / "leads" / "pipeline.json").exists()


def test_refuses_an_unmounted_volume(repo):
    p = setup(repo, "/Volumes/definitely-not-mounted-xyz/employment-jobs")
    assert p.returncode == 1 and "volume not mounted: /Volumes/definitely-not-mounted-xyz" in p.stderr


@pytest.mark.xfail(strict=True, reason="BUG: setup-storage seeds {} but check-postings reads ledger['jobs'] and crashes")
def test_seeded_ledger_is_readable_by_check_postings(repo, tmp_path):
    setup(repo, tmp_path / "store")
    p = subprocess.run([sys.executable, "-I", str(REPO / "scripts" / "check-postings.py"),
                        "--ledger", str(tmp_path / "store" / "leads" / "pipeline.json")], capture_output=True, text=True)
    assert p.returncode == 0, p.stderr
