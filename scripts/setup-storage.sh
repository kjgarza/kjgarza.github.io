#!/usr/bin/env bash
# Set up the storage symlinks for the job-search pipeline, for every profile in
# .claude/profiles/.
#
# The real data lives outside the repo so PII/comp data never enters the
# tree (or archives of it). The location is configurable per machine:
#
#   EMPLOYMENT_JOBS_DIR=/some/path scripts/setup-storage.sh
#
# Default: /Volumes/Verbatim-Vi560-Media/Development/employment-jobs
#
# Each profile's config.json declares its own storage paths:
#
#   kristian -> leads/            applications/
#   claudia  -> claudia/leads/    claudia/applications/    claudia/cv/
#
# A repo-relative path of "leads" links to $STORAGE_DIR/leads; a nested path
# like "claudia/leads" links its top-level segment ("claudia") once, so a single
# symlink covers every path under it.
#
# Idempotent. Run once per clone/worktree (the symlinks are untracked).
set -euo pipefail
umask 077

STORAGE_DIR="${EMPLOYMENT_JOBS_DIR:-/Volumes/Verbatim-Vi560-Media/Development/employment-jobs}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# If the storage dir lives on an external volume, refuse to create it while
# the volume is unmounted — mkdir -p would silently create a local directory
# at the mount point and mask the real disk.
if [[ "$STORAGE_DIR" == /Volumes/* ]]; then
  mount_point="/Volumes/$(echo "${STORAGE_DIR#/Volumes/}" | cut -d/ -f1)"
  if [[ ! -d "$mount_point" ]]; then
    echo "error: volume not mounted: $mount_point" >&2
    echo "       (mount it, or set EMPLOYMENT_JOBS_DIR to another location)" >&2
    exit 1
  fi
fi

if [[ ! -d "$REPO_ROOT/.claude/profiles" ]]; then
  echo "error: no .claude/profiles directory; nothing to link" >&2
  exit 1
fi

# Every storage path declared by every profile config, as
# "<profile-id> <repo-relative-path>" lines.
storage_paths() {
  python3 - "$REPO_ROOT" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
for cfg in sorted((root / ".claude" / "profiles").glob("*/config.json")):
    data = json.loads(cfg.read_text())
    for value in (data.get("storage") or {}).values():
        if value:
            print(data.get("id", cfg.parent.name), value)
PY
}

# Link the top-level segment of each path, once. "claudia/leads" and
# "claudia/cv" both resolve to a single "claudia" symlink.
linked=""
while read -r profile rel; do
  [[ -n "$rel" ]] || continue
  top="${rel%%/*}"
  case " $linked " in *" $top "*) continue ;; esac
  linked="$linked $top"

  target="$STORAGE_DIR/$top"
  link="$REPO_ROOT/$top"
  mkdir -p "$target"
  if [[ -e "$link" && ! -L "$link" ]]; then
    echo "error: $link exists and is not a symlink; move its contents to $target and remove it" >&2
    exit 1
  fi
  ln -sfn "$target" "$link"
  echo "$top -> $target  ($profile)"
done < <(storage_paths)

# Create each declared directory and seed empty ledgers.
while read -r profile rel; do
  [[ -n "$rel" ]] || continue
  mkdir -p "$STORAGE_DIR/$rel"
  case "$rel" in
    *leads)
      ledger="$STORAGE_DIR/$rel/pipeline.json"
      [[ -f "$ledger" ]] || { echo '{}' > "$ledger"; echo "seeded $rel/pipeline.json  ($profile)"; }
      ;;
  esac
done < <(storage_paths)
