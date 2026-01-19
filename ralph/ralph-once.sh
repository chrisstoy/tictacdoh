#!/bin/bash
# Ralph Wiggum - Single iteration
# Usage: ./ralph-once.sh
# Exit codes: 0 = completed all tasks, 1 = more work needed, 2 = error

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"

# Helper function to display PRD progress
show_prd_progress() {
  if [ ! -f "$PRD_FILE" ]; then
    echo "  No PRD file found"
    return
  fi

  local project_name=$(jq -r '.project // "Unknown"' "$PRD_FILE" 2>/dev/null)
  local branch_name=$(jq -r '.branchName // "Unknown"' "$PRD_FILE" 2>/dev/null)
  local total_stories=$(jq '.userStories | length' "$PRD_FILE" 2>/dev/null || echo 0)
  local completed_stories=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo 0)
  local in_progress=$(jq '[.userStories[] | select(.passes == "in-progress")] | length' "$PRD_FILE" 2>/dev/null || echo 0)
  local pending=$(jq '[.userStories[] | select(.passes == "pending" or .passes == null)] | length' "$PRD_FILE" 2>/dev/null || echo 0)

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

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    # Archive the previous run
    DATE=$(date +%Y-%m-%d)
    # Strip "ralph/" prefix from branch name for folder
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archived to: $ARCHIVE_FOLDER"

    # Reset progress file for new run
    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

ITERATION_START=$(date +%s)

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🤖 Ralph Wiggum - Single Iteration              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "  Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "───────────────────────────────────────────────────────────"
show_prd_progress
echo "───────────────────────────────────────────────────────────"
echo ""

# Run claude with the ralph prompt (output displayed live via tee)
OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" | claude --dangerously-skip-permissions 2>&1 | tee /dev/tty) || true

ITERATION_END=$(date +%s)
ITERATION_DURATION=$((ITERATION_END - ITERATION_START))

# Format duration
format_duration() {
  local seconds=$1
  local minutes=$((seconds / 60))
  local secs=$((seconds % 60))
  if [ $minutes -gt 0 ]; then
    printf "%dm %ds" $minutes $secs
  else
    printf "%ds" $secs
  fi
}

echo ""
echo "───────────────────────────────────────────────────────────"
echo "  Iteration complete ($(format_duration $ITERATION_DURATION))"
echo ""
show_prd_progress
echo "───────────────────────────────────────────────────────────"

# Check for completion signal
if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
  echo ""
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║               ✅ Ralph Completed All Tasks!               ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  exit 0
fi

# More work needed
exit 1
