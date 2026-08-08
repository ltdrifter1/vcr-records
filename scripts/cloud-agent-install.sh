#!/usr/bin/env bash
# Idempotent Cloud Agent install for Club Copy (static site + Vercel API handlers).
set -euo pipefail

node -v
npm -v

# Pre-warm the static preview server binary used by `start`.
npx --yes serve --version

# Syntax-check commerce handlers when present on this revision.
for f in \
  api/create-checkout-session.js \
  api/catalog.js \
  api/stripe-webhook.js \
  scripts/sync-stripe-catalog.js
do
  if [[ -f "$f" ]]; then
    node --check "$f"
    echo "checked $f"
  fi
done

echo "club-copy install ok"
