#!/usr/bin/env bash
# Asserts the dev-only component catalog (component-catalog spec: "The catalog
# ships nothing in the extension bundle") contributes zero bytes to the MV3
# production build.
#
# A byte-for-byte two-build diff was rejected: content-hashed chunk names make
# even two back-to-back builds of identical source differ, which would make this
# check flaky. Instead: run ONE production build, then assert the built output
# (dist/) contains no catalog-engine marker. The catalog lives under a sibling
# Vite config (catalog/) that no manifest entry or rollup input references, so
# Vite/Rollup tree-shake the engine out by reachability — this gate proves that
# stays true. A plain grep for "catalog" would false-positive on legitimate app
# source, so the markers below are specific to the catalog engine's own code.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$APP_DIR"

MARKERS=(
  "catalog: #app mount target is missing"
  "generateDerivedControls"
  "defineStory"
  "resolveControls"
)

echo "==> Building extension for production"
pnpm run build >/dev/null

echo "==> Checking dist/ contains no catalog engine code"
LEAKED=0
for marker in "${MARKERS[@]}"; do
  if grep -rl -- "$marker" dist >/dev/null 2>&1; then
    echo "✗ Found catalog marker '$marker' in production build output:"
    grep -rl -- "$marker" dist
    LEAKED=1
  fi
done

echo "==> Checking dist/ contains no file path naming 'catalog'"
CATALOG_PATHS="$(find dist -iname '*catalog*' || true)"
if [ -n "$CATALOG_PATHS" ]; then
  echo "✗ Found a file path under dist/ containing 'catalog':"
  echo "$CATALOG_PATHS"
  LEAKED=1
fi

if [ "$LEAKED" -eq 0 ]; then
  echo "✓ Production build contains no catalog engine code or paths"
  exit 0
else
  exit 1
fi
