"""Shared fixtures: load the hyphenated Python scripts as modules, and run the
shell scripts against a fake curl so no test touches the network."""
import importlib.util, json, os, subprocess, sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parent.parent
SKILLS = REPO / ".claude" / "skills"
FETCH_JOB = SKILLS / "find-kristian-jobs" / "scripts" / "fetch-job.sh"
FETCH_BOARD = SKILLS / "find-kristian-jobs" / "scripts" / "fetch-board.sh"
FETCH_FORM = SKILLS / "find-kristian-jobs" / "scripts" / "fetch-application-form.sh"


def load_script(name):
    """Import scripts/<name>.py (hyphenated, so not importable by name)."""
    path = REPO / "scripts" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture
def check_postings():
    return load_script("check-postings")  # fresh module: _ashby_cache starts empty


@pytest.fixture
def cordis():
    return load_script("cordis-leads")


class FakeCurl:
    def __init__(self, tmp):
        self.bin = tmp / "bin"
        self.bin.mkdir()
        (self.bin / "curl").symlink_to(REPO / "tests" / "fakecurl.py")
        self.routes_file, self.log = tmp / "routes.json", tmp / "curl.log"
        self.routes = []
        self.log.touch()

    def route(self, match, body="", status=200):
        """Serve body for any URL containing match. Dicts/lists are sent as JSON."""
        if not isinstance(body, str):
            body = json.dumps(body)
        self.routes.append({"match": match, "status": status, "body": body})

    def calls(self):
        return [json.loads(l) for l in self.log.read_text().splitlines()]

    def run(self, script, *args, env=None, check=True):
        self.routes_file.write_text(json.dumps(self.routes))
        e = {k: v for k, v in os.environ.items() if k != "JINA_API_KEY"}
        e.update(PATH=f"{self.bin}{os.pathsep}{e['PATH']}",
                 FAKE_CURL_ROUTES=str(self.routes_file), FAKE_CURL_LOG=str(self.log), **(env or {}))
        p = subprocess.run(["bash", str(script), *args], capture_output=True, text=True, env=e, timeout=60)
        if check:
            assert p.returncode == 0, p.stderr
        return p

    def json(self, script, *args, env=None):
        return json.loads(self.run(script, *args, env=env).stdout)


@pytest.fixture
def fake_curl(tmp_path):
    return FakeCurl(tmp_path)


def pytest_report_header():
    return f"python {sys.version.split()[0]}, repo {REPO}"
