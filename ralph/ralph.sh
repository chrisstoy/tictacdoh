#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop
# Usage: ./ralph.sh [max_iterations]

set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
START_TIME=$(date +%s)

# Helper function to format elapsed time
format_elapsed() {
  local seconds=$1
  local hours=$((seconds / 3600))
  local minutes=$(((seconds % 3600) / 60))
  local secs=$((seconds % 60))
  if [ $hours -gt 0 ]; then
    printf "%dh %dm %ds" $hours $minutes $secs
  elif [ $minutes -gt 0 ]; then
    printf "%dm %ds" $minutes $secs
  else
    printf "%ds" $secs
  fi
}

# Helper function to display PRD progress
show_prd_progress() {
  if [ ! -f "$PRD_FILE" ]; then
    echo "  No PRD file found"
    return
  fi

  local project_name=$(jq -r '.projectName // "Unknown"' "$PRD_FILE" 2>/dev/null)
  local branch_name=$(jq -r '.branchName // "Unknown"' "$PRD_FILE" 2>/dev/null)
  local total_stories=$(jq '.userStories | length' "$PRD_FILE" 2>/dev/null || echo 0)
  local completed_stories=$(jq '[.userStories[] | select(.status == "done")] | length' "$PRD_FILE" 2>/dev/null || echo 0)
  local in_progress=$(jq '[.userStories[] | select(.status == "in-progress")] | length' "$PRD_FILE" 2>/dev/null || echo 0)
  local pending=$(jq '[.userStories[] | select(.status == "pending" or .status == null)] | length' "$PRD_FILE" 2>/dev/null || echo 0)

  echo "  Project: $project_name"
  echo "  Branch:  $branch_name"
  echo ""
  echo "  User Stories Progress:"
  echo "    ✓ Completed:   $completed_stories / $total_stories"
  echo "    ⚙ In Progress: $in_progress"
  echo "    ○ Pending:     $pending"

  # Show progress bar
  if [ "$total_stories" -gt 0 ]; then
    local percent=$((completed_stories * 100 / total_stories))
    local filled=$((percent / 5))
    local empty=$((20 - filled))
    printf "    ["
    printf "%0.s█" $(seq 1 $filled) 2>/dev/null || true
    printf "%0.s░" $(seq 1 $empty) 2>/dev/null || true
    printf "] %d%%\n" $percent
  fi

  # Show current in-progress story if any
  if [ "$in_progress" -gt 0 ]; then
    echo ""
    echo "  Currently working on:"
    jq -r '.userStories[] | select(.status == "in-progress") | "    → \(.id): \(.title)"' "$PRD_FILE" 2>/dev/null
  fi
}

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🤖 Ralph Wiggum - AI Agent Loop                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "  Started:        $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Max Iterations: $MAX_ITERATIONS"
echo ""
echo "───────────────────────────────────────────────────────────"
show_prd_progress
echo "───────────────────────────────────────────────────────────"

for i in $(seq 1 $MAX_ITERATIONS); do
  ITERATION_START=$(date +%s)
  ELAPSED=$((ITERATION_START - START_TIME))

  echo ""
  echo "╔═══════════════════════════════════════════════════════════╗"
  printf "║  Iteration %2d of %-2d                                      ║\n" $i $MAX_ITERATIONS
  echo "║                                                           ║"
  printf "║  Elapsed: %-47s ║\n" "$(format_elapsed $ELAPSED)"
  echo "╚═══════════════════════════════════════════════════════════╝"

  # Run single iteration
  set +e
  "$SCRIPT_DIR/ralph-once.sh"
  EXIT_CODE=$?
  set -e

  ITERATION_END=$(date +%s)
  ITERATION_DURATION=$((ITERATION_END - ITERATION_START))

  # Check exit code from ralph-once.sh
  if [ $EXIT_CODE -eq 0 ]; then
    TOTAL_ELAPSED=$((ITERATION_END - START_TIME))
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  Finished at:      $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  Total iterations: $i of $MAX_ITERATIONS"
    echo "  Total time:       $(format_elapsed $TOTAL_ELAPSED)"
    echo "═══════════════════════════════════════════════════════════"
    exit 0
  fi

  echo ""
  echo "  Iteration $i took $(format_elapsed $ITERATION_DURATION)"
  echo "  Continuing to next iteration in 2 seconds..."
  sleep 2
done

TOTAL_ELAPSED=$(($(date +%s) - START_TIME))
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           ⚠️  Ralph Reached Max Iterations                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "  Max iterations: $MAX_ITERATIONS"
echo "  Total time:     $(format_elapsed $TOTAL_ELAPSED)"
echo ""
echo "───────────────────────────────────────────────────────────"
show_prd_progress
echo "───────────────────────────────────────────────────────────"
echo ""
echo "  Check progress.txt for detailed status."
exit 1
