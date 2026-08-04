#!/usr/bin/env bash
# Set up the leads/ and applications/ symlinks for the job-search pipeline.
#
# The real data lives outside the repo so PII/comp data never enters the
# tree (or archives of it). The location is configurable per machine:
#
#   EMPLOYMENT_JOBS_DIR=/some/path scripts/setup-storage.sh
#
# Default: /Volumes/Verbatim-Vi560-Media/Development/employment-jobs
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

mkdir -p "$STORAGE_DIR/leads" "$STORAGE_DIR/applications"
[[ -f "$STORAGE_DIR/leads/pipeline.json" ]] || echo '{}' > "$STORAGE_DIR/leads/pipeline.json"

for name in leads applications; do
  target="$STORAGE_DIR/$name"
  link="$REPO_ROOT/$name"
  if [[ -e "$link" && ! -L "$link" ]]; then
    echo "error: $link exists and is not a symlink; move its contents to $target and remove it" >&2
    exit 1
  fi
  ln -sfn "$target" "$link"
  echo "$name -> $target"
done
