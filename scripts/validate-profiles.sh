#!/usr/bin/env bash
# Regression check for the profile-parameterized job-search skills.
#
#   scripts/validate-profiles.sh                  # check
#   scripts/validate-profiles.sh --update-baseline # accept intentional edits to
#                                                  # Kristian's reference files
#
# The point of this script is one specific fear: parameterizing the skills for a
# second candidate must not degrade Kristian's pipeline. It asserts that his
# reference files are byte-identical to the recorded baseline, that the default
# profile still resolves to him, and that no profile can silently read another
# candidate's data.
#
# Exit 0 = safe. Any failure prints "FAIL: <what>" and exits 1.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BASELINE=".claude/profiles/kristian/reference-baseline.sha256"
fails=0
pass() { printf '  ok    %s\n' "$1"; }
fail() { printf 'FAIL: %s\n' "$1"; fails=$((fails + 1)); }

if [[ "${1:-}" == "--update-baseline" ]]; then
  shasum -a 256 $(awk '{print $2}' "$BASELINE") > "$BASELINE"
  echo "baseline updated: $BASELINE"
  echo "commit it with the reference-file change so the diff shows both."
  exit 0
fi

echo "== 1. Kristian's reference files unchanged (no-regression guard)"
if [[ ! -f "$BASELINE" ]]; then
  fail "baseline file missing: $BASELINE"
elif shasum -a 256 -c "$BASELINE" --status 2>/dev/null; then
  pass "$(wc -l < "$BASELINE" | tr -d ' ') files match baseline"
else
  fail "reference/script files changed since baseline:"
  shasum -a 256 -c "$BASELINE" 2>&1 | grep -v ': OK$' | sed 's/^/        /'
  echo "        If the change was intentional, rerun with --update-baseline."
fi

echo "== 2. Profile configs are well-formed"
python3 - <<'PY'
import json, pathlib, sys

root = pathlib.Path(".")
configs = sorted(root.glob(".claude/profiles/*/config.json"))
fails = []
if not configs:
    fails.append("no profile configs found")

defaults = []
for cfg in configs:
    pid = cfg.parent.name
    try:
        data = json.loads(cfg.read_text())
    except json.JSONDecodeError as exc:
        fails.append(f"{cfg}: invalid JSON ({exc})")
        continue
    if data.get("id") != pid:
        fails.append(f"{cfg}: id {data.get('id')!r} != directory name {pid!r}")
    for key in ("displayName", "references", "storage", "cv"):
        if key not in data:
            fails.append(f"{cfg}: missing required key {key!r}")
    for key in ("profile", "searchProfile", "targetCompanies", "scoringMatrix",
                "toneAndVoice", "decisionPolicy"):
        if key not in (data.get("references") or {}):
            fails.append(f"{cfg}: references.{key} missing")
    mode = (data.get("cv") or {}).get("mode")
    if mode not in ("data-driven", "static-pdf"):
        fails.append(f"{cfg}: cv.mode {mode!r} is not data-driven or static-pdf")
    if data.get("default"):
        defaults.append(pid)

if len(defaults) != 1:
    fails.append(f"exactly one profile must be default, found {defaults}")
elif defaults[0] != "kristian":
    fails.append(f"default profile is {defaults[0]!r}, expected 'kristian' "
                 "(a bare skill invocation must keep behaving as Kristian's)")

for f in fails:
    print(f"FAIL: {f}")
print(f"  ok    {len(configs)} config(s) parsed, default = {defaults[0] if len(defaults)==1 else '?'}")
sys.exit(1 if fails else 0)
PY
[[ $? -eq 0 ]] || fails=$((fails + 1))

echo "== 3. Every referenced file resolves, and belongs to its own profile"
python3 - <<'PY'
import json, pathlib, sys

root = pathlib.Path(".")
fails = []
# Which path prefixes each profile is allowed to read from. Anything else means
# a config points at another candidate's data.
for cfg in sorted(root.glob(".claude/profiles/*/config.json")):
    pid = cfg.parent.name
    data = json.loads(cfg.read_text())
    storage_tops = {v.split("/")[0] for v in (data.get("storage") or {}).values() if v}
    allowed = {f".claude/profiles/{pid}/", *(f"{t}/" for t in storage_tops)}
    if pid == "kristian":
        # Legacy in-repo layout: his files stay at their original skill paths.
        allowed.add(".claude/skills/")
    for key, rel in (data.get("references") or {}).items():
        p = root / rel
        if not p.exists():
            fails.append(f"{pid}: references.{key} -> {rel} does not exist")
            continue
        if not any(rel.startswith(a) for a in allowed):
            fails.append(f"{pid}: references.{key} -> {rel} is outside this "
                         f"profile's allowed paths {sorted(allowed)}")
    cv = data.get("cv") or {}
    if cv.get("mode") == "static-pdf":
        f = cv.get("file")
        if not f:
            fails.append(f"{pid}: cv.mode is static-pdf but cv.file is unset")
        elif not (root / f).exists():
            fails.append(f"{pid}: cv.file -> {f} does not exist "
                         "(run scripts/setup-storage.sh, or add the CV)")
    if cv.get("mode") == "data-driven":
        for key in ("schemaReference", "masterData"):
            f = cv.get(key)
            if f and not (root / f).exists():
                fails.append(f"{pid}: cv.{key} -> {f} does not exist")
        if cv.get("masterData") and not any(
                cv["masterData"].startswith(a) for a in allowed):
            fails.append(f"{pid}: cv.masterData -> {cv['masterData']} is outside "
                         f"this profile's allowed paths {sorted(allowed)}")

for f in fails:
    print(f"FAIL: {f}")
if not fails:
    print("  ok    all reference paths resolve within their own profile")
sys.exit(1 if fails else 0)
PY
[[ $? -eq 0 ]] || fails=$((fails + 1))

echo "== 4. Storage symlinks resolve"
python3 - <<'PY'
import json, pathlib, sys
root = pathlib.Path(".")
fails, seen = [], set()
for cfg in sorted(root.glob(".claude/profiles/*/config.json")):
    data = json.loads(cfg.read_text())
    for rel in (data.get("storage") or {}).values():
        if not rel or rel in seen:
            continue
        seen.add(rel)
        p = root / rel
        top = root / rel.split("/")[0]
        if not top.is_symlink():
            fails.append(f"{top} is not a symlink (run scripts/setup-storage.sh)")
        elif not p.exists():
            fails.append(f"{rel} does not resolve (run scripts/setup-storage.sh)")
for f in fails:
    print(f"FAIL: {f}")
if not fails:
    print(f"  ok    {len(seen)} storage path(s) resolve through symlinks")
sys.exit(1 if fails else 0)
PY
[[ $? -eq 0 ]] || fails=$((fails + 1))

echo "== 5. Every SKILL.md has parseable frontmatter"
python3 - <<'PY'
import pathlib, sys
try:
    import yaml
except ImportError:
    print("  skip  PyYAML not installed; frontmatter not checked")
    sys.exit(0)

fails = []
for p in sorted(pathlib.Path(".claude/skills").glob("*/SKILL.md")):
    parts = p.read_text().split("---")
    if len(parts) < 3:
        fails.append(f"{p}: no YAML frontmatter block")
        continue
    try:
        fm = yaml.safe_load(parts[1])
    except yaml.YAMLError as exc:
        # The usual cause: an unquoted description containing ": ", which YAML
        # reads as a nested mapping. Quote the whole description value.
        fails.append(f"{p}: frontmatter does not parse ({str(exc).splitlines()[0]})")
        continue
    for key in ("name", "description"):
        if not (fm or {}).get(key):
            fails.append(f"{p}: frontmatter missing {key!r}")
    if fm and fm.get("name") != p.parent.name:
        fails.append(f"{p}: name {fm.get('name')!r} != directory {p.parent.name!r}")

for f in fails:
    print(f"FAIL: {f}")
if not fails:
    print(f"  ok    {len(list(pathlib.Path('.claude/skills').glob('*/SKILL.md')))} SKILL.md frontmatter blocks parse")
sys.exit(1 if fails else 0)
PY
[[ $? -eq 0 ]] || fails=$((fails + 1))

echo "== 6. Skills carry a profile-resolution step"
for f in .claude/skills/generate-application/SKILL.md \
         .claude/skills/find-kristian-jobs/SKILL.md \
         .claude/skills/job-pipeline/SKILL.md; do
  if grep -qi "resolve the profile" "$f" && grep -q '\-\-profile' "$f"; then
    pass "$(basename "$(dirname "$f")") resolves a profile"
  else
    fail "$f has no profile-resolution step"
  fi
done

echo "== 7. No candidate PII tracked for external-storage profiles"
python3 - <<'PY'
import json, pathlib, subprocess, sys
root = pathlib.Path(".")
tracked = set(subprocess.run(["git", "ls-files"], capture_output=True, text=True).stdout.split())
fails = []
for cfg in sorted(root.glob(".claude/profiles/*/config.json")):
    data = json.loads(cfg.read_text())
    if data.get("layout") != "external-storage":
        continue
    pid = data["id"]
    for key in ("profile", "searchProfile", "decisionPolicy"):
        rel = (data.get("references") or {}).get(key)
        if rel and rel in tracked:
            fails.append(f"{pid}: references.{key} -> {rel} is tracked in git; "
                         "PII must stay in external storage")
    f = (data.get("cv") or {}).get("file")
    if f and f in tracked:
        fails.append(f"{pid}: cv.file -> {f} is tracked in git")
for f in fails:
    print(f"FAIL: {f}")
if not fails:
    print("  ok    no PII-bearing profile file is tracked")
sys.exit(1 if fails else 0)
PY
[[ $? -eq 0 ]] || fails=$((fails + 1))

echo
if [[ $fails -eq 0 ]]; then
  echo "PASS — profiles validate, Kristian's pipeline is unchanged."
  exit 0
fi
echo "$fails check(s) failed."
exit 1
