#!/usr/bin/env bash
set -euo pipefail

# Azure Static Web Apps deployment helper.
# This repository deploys through GitHub Actions, not by uploading files to a VPS.
#
# Usage:
#   ./deploy.sh                  # deploy current main branch to production
#   ./deploy.sh production       # deploy main to production
#   ./deploy.sh staging          # deploy test-staging to staging
#
# Options:
#   SKIP_BUILD=1 ./deploy.sh     # skip local build preflight
#   WATCH=0 ./deploy.sh          # do not wait for the GitHub Actions run

WORKFLOW_FILE="azure-static-web-apps-lively-beach-041007e0f.yml"
ENVIRONMENT="${1:-production}"
SKIP_BUILD="${SKIP_BUILD:-0}"
WATCH="${WATCH:-1}"

case "$ENVIRONMENT" in
  production|prod)
    TARGET_ENV="production"
    TARGET_BRANCH="main"
    ;;
  staging|stage)
    TARGET_ENV="staging"
    TARGET_BRANCH="test-staging"
    ;;
  *)
    echo "Usage: $0 [production|staging]"
    exit 2
    ;;
esac

echo "Starting Azure Static Web Apps deployment..."
echo "Environment: $TARGET_ENV"
echo "Branch:      $TARGET_BRANCH"
echo "Workflow:    .github/workflows/$WORKFLOW_FILE"

if [ ! -f ".github/workflows/$WORKFLOW_FILE" ]; then
  echo "Error: Azure workflow not found: .github/workflows/$WORKFLOW_FILE"
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
  echo "Error: current branch is '$CURRENT_BRANCH', but $TARGET_ENV deploys from '$TARGET_BRANCH'."
  echo "Switch branches first:"
  echo "  git checkout $TARGET_BRANCH"
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: you have uncommitted changes. Commit or stash them before deploying."
  exit 1
fi

if [ "$SKIP_BUILD" != "1" ]; then
  echo "Running local build preflight..."
  npm run build
fi

echo "Pushing '$TARGET_BRANCH' to origin to trigger Azure Static Web Apps..."
git push origin "$TARGET_BRANCH"

echo "Azure deployment triggered."

if command -v gh >/dev/null 2>&1; then
  echo "Latest workflow run:"
  gh run list --workflow "$WORKFLOW_FILE" --branch "$TARGET_BRANCH" --limit 1

  if [ "$WATCH" = "1" ]; then
    RUN_ID="$(gh run list --workflow "$WORKFLOW_FILE" --branch "$TARGET_BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId')"
    if [ -n "$RUN_ID" ] && [ "$RUN_ID" != "null" ]; then
      echo "Watching workflow run $RUN_ID..."
      gh run watch "$RUN_ID"
    fi
  fi
else
  echo "Install GitHub CLI to watch the workflow from this script:"
  echo "  brew install gh"
fi
