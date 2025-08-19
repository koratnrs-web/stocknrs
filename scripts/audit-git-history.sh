# =============================
# path: scripts/audit-git-history.sh
# =============================
#!/usr/bin/env bash
# Purpose: Audit if sensitive paths (e.g., .env, node_modules, dist) ever existed in Git (current tree + history)
# Usage: bash scripts/audit-git-history.sh
# Requirements: git
set -euo pipefail

RED="\033[31m"; GREEN="\033[32m"; YELLOW="\033[33m"; BLUE="\033[34m"; BOLD="\033[1m"; RESET="\033[0m"

say() { printf "%b\n" "$*"; }
ok()  { say "${GREEN}✔${RESET} $*"; }
warn(){ say "${YELLOW}△${RESET} $*"; }
err() { say "${RED}✘${RESET} $*"; }

# 1) Ensure inside a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  err "Not inside a Git repository."; exit 1
fi

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

say "${BOLD}Git History Audit (repo: $ROOT)${RESET}"

# 2) Patterns to check (edit as needed)
# - Exact paths should use PATHS_EXACT
# - Globs should use PATHS_GLOB (Git pathspec globs)
PATHS_EXACT=(".env" ".envrc" ".env.local")
PATHS_GLOB=(".env*" "**/*.env" "node_modules/**" "dist/**")

# 3) Current tree check (tracked files)
say "\n${BLUE}Current tracked files check${RESET}"
set +e
CURR=$(git ls-files -- "${PATHS_EXACT[@]}" "${PATHS_GLOB[@]}" 2>/dev/null | sort -u)
set -e
if [[ -n "$CURR" ]]; then
  warn "Sensitive files currently tracked:"; echo "$CURR" | sed 's/^/  • /'
else
  ok "No sensitive files currently tracked."
fi

# 4) History check (ever committed?)
say "\n${BLUE}History check (ever committed)${RESET}"
set +e
HIST=$(git log --all --name-only --pretty=format: -- "${PATHS_EXACT[@]}" "${PATHS_GLOB[@]}" | sed '/^$/d' | sort -u)
set -e
if [[ -n "$HIST" ]]; then
  err "Sensitive paths found in history:"; echo "$HIST" | sed 's/^/  • /'
  HAS_HISTORY=1
else
  ok "No sensitive paths found in history."
  HAS_HISTORY=0
fi

# 5) Build recommended git-filter-repo command
#    (only if history contains sensitive paths)
if [[ "$HAS_HISTORY" -eq 1 ]]; then
  say "\n${BLUE}Recommended purge command (git-filter-repo)${RESET}"
  FILTER_ARGS=()
  for p in "${PATHS_EXACT[@]}"; do FILTER_ARGS+=(--path "$p"); done
  for g in "${PATHS_GLOB[@]}"; do FILTER_ARGS+=(--path-glob "$g"); done
  echo "git filter-repo ${FILTER_ARGS[*]} --invert-paths"
  warn "This rewrites history. You will need to force-push and collaborators must re-clone."
fi

# 6) Extra maintenance suggestions
say "\n${BLUE}Next steps${RESET}"
if [[ -n "$CURR" ]]; then
  say "- Untrack current sensitive files (keeps working copy):"
  echo "  git rm -r --cached .env node_modules dist 2>/dev/null || true"
  echo "  echo -e '\n# env\n.env\n*.env*\n\n# deps/build\nnode_modules/\ndist/' >> .gitignore && git add .gitignore"
  echo "  git commit -m 'chore: ignore secrets and build artifacts'"
fi
if [[ "$HAS_HISTORY" -eq 1 ]]; then
  say "- Purge from history (backup first):"
  echo "  git remote -v"
  echo "  git branch"
  echo "  git tag -l | wc -l"
  echo "  # Install git-filter-repo: brew install git-filter-repo | pipx/pip install git-filter-repo"
  echo "  # Create a mirror backup:"
  echo "  git clone --mirror . ../repo-mirror.git && echo 'Backup at ../repo-mirror.git'"
  echo "  # Run filter-repo as shown above, then:"
  echo "  git push --force --tags"
  echo "  git for-each-ref --format='delete %(refname)' refs/original/ | git update-ref --stdin"
  echo "  git reflog expire --expire=now --all && git gc --prune=now --aggressive"
fi

ok "Audit complete."
