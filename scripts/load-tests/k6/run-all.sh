#!/usr/bin/env bash
# =============================================================================
# KaaryaMitra — k6 Load Test Runner
# =============================================================================
# Usage:
#   ./run-all.sh [--base-url http://staging.kaaryamitra.com] [--vus 20]
#
# Prerequisites:
#   - k6 installed (https://k6.io/docs/getting-started/installation/)
#   - ACCESS_TOKEN and TENANT_SLUG set or passed as env vars
# =============================================================================

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
VUS="${VUS:-20}"
DURATION="${DURATION:-60s}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"
TENANT_SLUG="${TENANT_SLUG:-demo}"
RESULTS_DIR="./results/$(date +%Y-%m-%d_%H-%M-%S)"

while [[ $# -gt 0 ]]; do
  case $1 in
    --base-url) BASE_URL="$2"; shift 2 ;;
    --vus) VUS="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if ! command -v k6 &> /dev/null; then
  echo "❌ k6 is not installed. Install from: https://k6.io/docs/getting-started/installation/"
  exit 1
fi

mkdir -p "$RESULTS_DIR"

echo "=============================================="
echo " KaaryaMitra Load Test Suite"
echo " Target: ${BASE_URL}"
echo " VUs: ${VUS} | Duration: ${DURATION}"
echo "=============================================="
echo ""

run_test() {
  local script="$1"
  local name="$2"
  local result_file="${RESULTS_DIR}/${name}.json"

  echo "▶ Running: ${name}"
  k6 run \
    --vus "$VUS" \
    --duration "$DURATION" \
    --out "json=${result_file}" \
    -e "BASE_URL=${BASE_URL}" \
    -e "ACCESS_TOKEN=${ACCESS_TOKEN}" \
    -e "TENANT_SLUG=${TENANT_SLUG}" \
    "$script" \
    && echo "  ✅ ${name} passed" \
    || echo "  ❌ ${name} FAILED (check ${result_file})"
  echo ""
}

run_test "$(dirname "$0")/auth-flow.js" "auth-flow"
run_test "$(dirname "$0")/employee-list.js" "employee-list"

echo "=============================================="
echo " All tests complete. Results in: ${RESULTS_DIR}"
echo "=============================================="
