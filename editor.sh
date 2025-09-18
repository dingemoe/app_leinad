#!/bin/bash
# Universal JS editor for render.js and tracer.js
# Auto-increments version, validates syntax, commits and pushes to repo
# Usage: 
#   ./editor.sh --file render.js --reset         (git checkout specific file)
#   ./editor.sh --file tracer.js --check         (validate syntax only)
#   ./editor.sh --file render.js --comment 10 20 (comment lines 10-20)
#   ./editor.sh --file render.js --uncomment 10 20 (uncomment lines 10-20)
#   ./editor.sh --file render.js --extract-function "methodName" (show function code)
#   ./editor.sh --file render.js --add-method "name" "code" (add method)
#   ./editor.sh --file render.js --replace "old" "new" (replace text)
#   ./editor.sh --update                         (auto-increment version both files)
#   ./editor.sh --history                        (show git commit history)
#   ./editor.sh --diff                           (show current changes vs last commit)
#   ./editor.sh --log 5                          (show last 5 commits)
#   ./editor.sh --show-commit abc123             (show specific commit changes)

set -e

# Parse flags
RESET=false
CHECK_ONLY=false
COMMENT_FROM=""
COMMENT_TO=""
UNCOMMENT_FROM=""
UNCOMMENT_TO=""
EXTRACT_FUNC=""
ADD_METHOD_NAME=""
ADD_METHOD_CODE=""
REPLACE_OLD=""
REPLACE_NEW=""
UPDATE_VERSION=false
TARGET_FILE=""
SHOW_HISTORY=false
SHOW_DIFF=false
SHOW_LOG=""
SHOW_COMMIT=""
SHOW_LINES=""
REMOVE_FROM=""
REMOVE_TO=""
MULTILINE_OLD=""
MULTILINE_NEW=""
SYNC_CHECK=false
FORCE_PUSH=false
COMPARE_GITHUB=false
CHECK_LOGS=""
LIVE_LOGS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --file) TARGET_FILE="classes/$2"; shift 2 ;;
        --reset) RESET=true; shift ;;
        --check) CHECK_ONLY=true; shift ;;
        --comment) COMMENT_FROM="$2"; COMMENT_TO="$3"; shift 3 ;;
        --uncomment) UNCOMMENT_FROM="$2"; UNCOMMENT_TO="$3"; shift 3 ;;
        --extract-function) EXTRACT_FUNC="$2"; shift 2 ;;
        --add-method) ADD_METHOD_NAME="$2"; ADD_METHOD_CODE="$3"; shift 3 ;;
        --replace) REPLACE_OLD="$2"; REPLACE_NEW="$3"; shift 3 ;;
        --update) UPDATE_VERSION=true; shift ;;
        --history) SHOW_HISTORY=true; shift ;;
        --diff) SHOW_DIFF=true; shift ;;
        --log) SHOW_LOG="$2"; shift 2 ;;
                --show-commit) SHOW_COMMIT="$2"; shift 2 ;;
        --lines) SHOW_LINES="$2"; shift 2 ;;
        --remove-lines) REMOVE_FROM="$2"; REMOVE_TO="$3"; shift 3 ;;
        --multiline-replace) MULTILINE_OLD="$2"; MULTILINE_NEW="$3"; shift 3 ;;
        --check-logs) CHECK_LOGS="$2"; shift 2 ;;
        --live-logs) LIVE_LOGS=true; shift ;;
        *) UPDATE_VERSION=true; break ;;
        --lines) SHOW_LINES="$2"; shift 2 ;;
        --remove-lines) REMOVE_FROM="$2"; REMOVE_TO="$3"; shift 3 ;;
        --multiline-replace) MULTILINE_OLD="$2"; MULTILINE_NEW="$3"; shift 3 ;;
        --sync) SYNC_CHECK=true; shift ;;
        --force-push) FORCE_PUSH=true; shift ;;
        --compare) COMPARE_GITHUB=true; shift ;;
        *) UPDATE_VERSION=true; break ;;
    esac
done

DATE="$(date +%Y-%m-%d)"
ALL_JS_FILES="classes/render.js classes/tracer.js"

# Determine which files to work with
if [ -n "$TARGET_FILE" ]; then
    if [[ "$TARGET_FILE" == "classes/render.js" || "$TARGET_FILE" == "classes/tracer.js" ]]; then
        JS_FILES="$TARGET_FILE"
    else
        echo "❌ Error: --file must be 'render.js' or 'tracer.js'"
        exit 1
    fi
else
    JS_FILES="$ALL_JS_FILES"
fi

# Auto-increment version number
auto_increment_version() {
    local file="$1"
    if grep -q "static VERSION =" "$file"; then
        local current_version=$(grep "static VERSION =" "$file" | sed 's/.*"\([^"]*\)".*/\1/')
        local major=$(echo $current_version | cut -d. -f1)
        local minor=$(echo $current_version | cut -d. -f2)
        local patch=$(echo $current_version | cut -d. -f3)
        patch=$((patch + 1))
        echo "$major.$minor.$patch"
    else
        echo "1.0.0"
    fi
}

# Validate JS syntax
validate_js() {
    local file="$1"
    echo "🔍 Validating $file..."
    if node -c "$file" 2>/dev/null; then
        echo "✓ [$file] Syntax OK"
        return 0
    else
        echo "✗ [$file] Syntax ERROR:"
        node -c "$file"
        return 1
    fi
}

# Reset files to clean state
reset_files() {
    if [ -n "$TARGET_FILE" ]; then
        echo "🔄 [$TARGET_FILE] Resetting to clean state..."
        git checkout "$TARGET_FILE"
    else
        echo "🔄 [ALL] Resetting JS files to clean state..."
        git checkout $ALL_JS_FILES
    fi
    echo "✓ Files reset"
}

# Comment lines in file
comment_lines() {
    local file="$1"
    local from="$2"
    local to="$3"
    echo "💬 [$file] Commenting lines $from-$to..."
    sed -i "${from},${to}s/^/\/\/ /" "$file"
}

# Uncomment lines in file  
uncomment_lines() {
    local file="$1"
    local from="$2"
    local to="$3"
    echo "🗨️ [$file] Uncommenting lines $from-$to..."
    sed -i "${from},${to}s/^\/\/ //" "$file"
}

# Extract function from file
extract_function() {
    local file="$1"
    local func_name="$2"
    echo "🔍 [$file] Extracting function '$func_name':"
    echo "----------------------------------------"
    awk "/$func_name\s*\(/,/^\s*}/" "$file"
    echo "----------------------------------------"
}

# Remove specific line range
remove_lines() {
    local file="$1"
    local from="$2"
    local to="$3"
    
    echo "🗑️ [$file] Removing lines $from-$to..."
    sed -i "${from},${to}d" "$file"
}

# Advanced multiline replace using temporary files
multiline_replace() {
    local file="$1"
    local old_pattern="$2"
    local new_content="$3"
    
    echo "🔄 [$file] Advanced multiline replacement..."
    
    # Create temporary files
    local temp_old="/tmp/editor_old_$$"
    local temp_new="/tmp/editor_new_$$"
    local temp_result="/tmp/editor_result_$$"
    
    # Write patterns to temp files
    echo "$old_pattern" > "$temp_old"
    echo "$new_content" > "$temp_new"
    
    # Use Python for complex multiline replacement
    python3 -c "
import sys
with open('$file', 'r') as f:
    content = f.read()
with open('$temp_old', 'r') as f:
    old = f.read().strip()
with open('$temp_new', 'r') as f:
    new = f.read().strip()
    
result = content.replace(old, new)
with open('$temp_result', 'w') as f:
    f.write(result)
"
    
    # Replace original file if successful
    if [ $? -eq 0 ] && [ -f "$temp_result" ]; then
        cp "$temp_result" "$file"
        echo "✓ [$file] Multiline replacement completed"
    else
        echo "✗ [$file] Multiline replacement failed"
        return 1
    fi
    
    # Cleanup
    rm -f "$temp_old" "$temp_new" "$temp_result"
}

# Compare local files with GitHub
compare_with_github() {
    local file="$1"
    local github_url="https://raw.githubusercontent.com/dingemoe/app_leinad/main/$file"
    local temp_github="/tmp/github_${file##*/}_$$"
    
    echo "🔍 [${file##*/}] Comparing with GitHub..."
    
    # Download GitHub version
    if ! curl -s "$github_url" > "$temp_github"; then
        echo "❌ [${file##*/}] Failed to download from GitHub"
        return 1
    fi
    
    # Compare files
    if diff -q "$file" "$temp_github" >/dev/null 2>&1; then
        echo "✅ [${file##*/}] Local and GitHub versions match"
        rm -f "$temp_github"
        return 0
    else
        echo "⚠️ [${file##*/}] Local and GitHub versions differ"
        echo "==================== DIFFERENCES ===================="
        diff -u "$temp_github" "$file" | head -20
        echo "======================================================"
        rm -f "$temp_github"
        return 1
    fi
}

# Sync local files to GitHub (auto-commit and push)
sync_to_github() {
    local file="$1"
    
    echo "🚀 [${file##*/}] Syncing to GitHub..."
    
    # Validate syntax first
    if ! validate_js "$file"; then
        echo "❌ [${file##*/}] Syntax error - cannot sync"
        return 1
    fi
    
    # Auto-increment version and update metadata
    auto_increment_version "$file"
    update_metadata "$file" "$new_version"
    
    # Git operations
    git add "$file"
    local commit_msg="Auto-sync ${file##*/} v$new_version ($(date +%Y-%m-%d))"
    git commit -m "$commit_msg"
    
    if [ "$FORCE_PUSH" = true ]; then
        git push --force-with-lease
        echo "🔥 [${file##*/}] Force pushed to GitHub"
    else
        git push
        echo "✅ [${file##*/}] Pushed to GitHub"
    fi
}

# Check GitHub sync status for all JS files
check_sync_status() {
    echo "📡 [SYNC] Checking GitHub sync status..."
    echo "=========================================="
    
    local all_synced=true
    for file in $ALL_JS_FILES; do
        if [ -f "$file" ]; then
            if ! compare_with_github "$file"; then
                all_synced=false
            fi
        fi
    done
    
    echo "=========================================="
    if [ "$all_synced" = true ]; then
        echo "🎉 [SYNC] All files are synchronized with GitHub"
    else
        echo "⚠️ [SYNC] Some files need synchronization"
        echo "Run: ./editor.sh --sync to auto-sync all files"
    fi
}

# Auto-sync all JS files to GitHub
auto_sync_all() {
    echo "🔄 [SYNC] Auto-syncing all JS files to GitHub..."
    echo "=========================================="
    
    for file in $ALL_JS_FILES; do
        if [ -f "$file" ]; then
            # Compare first
            if ! compare_with_github "$file"; then
                echo "🔄 [${file##*/}] Needs sync - pushing to GitHub..."
                sync_to_github "$file"
            fi
        fi
    done
    
    echo "=========================================="
    echo "✅ [SYNC] Auto-sync completed"
}

# Check Deno KV logs from API
check_deno_logs() {
    local token_or_location="$1"
    local api_base="https://leinad-log.deno.dev"
    
    echo "📊 [LOGS] Fetching logs from Deno KV API..."
    echo "=========================================="
    
    if [ -n "$token_or_location" ]; then
        # Try as token first, then as location
        echo "🔑 Trying as token: $token_or_location"
        local url_token="$api_base/logs?token=$token_or_location&limit=20"
        
        echo "🔗 API: $url_token"
        echo "------------------------------------------"
        
        if curl -s -H "Accept: application/json" "$url_token" | python3 -c "
import json
import sys
try:
    data = json.load(sys.stdin)
    if isinstance(data, dict) and 'error' in data:
        print('❌ Token not found, trying as location filter...')
        exit(1)
    elif isinstance(data, list) and len(data) > 0:
        print(f'✅ Found {len(data)} logs with token')
        for item in data[:5]:
            dt = item.get('datetime', 'No time')
            event = item.get('event', item.get('mode', 'unknown'))
            loc = item.get('location', 'unknown')
            print(f'🕒 {dt} | 📍 {loc} | 🎯 {event}')
        exit(0)
    else:
        exit(1)
except:
    exit(1)
" 2>/dev/null; then
            echo "=========================================="
            return 0
        fi
        
        # Fallback to location filter
        echo "🌐 Trying as location: $token_or_location"
        local url_location="$api_base/logs?location=$token_or_location&limit=20"
        echo "🔗 API: $url_location"
        
    else
        local url_location="$api_base/logs?limit=20"
        echo "🔗 API: $url_location"
    fi
    
    echo "------------------------------------------"
    
    # Fetch logs with curl
    if curl -s -H "Accept: application/json" "$url_location" | python3 -m json.tool 2>/dev/null; then
        echo ""
        echo "✅ [LOGS] Successfully fetched logs"
    else
        echo "❌ [LOGS] Failed to fetch logs or invalid JSON"
        echo "Raw response:"
        curl -s "$url_location"
    fi
    
    echo "=========================================="
}

# Live log monitoring (with auto-refresh)
live_log_monitor() {
    local location_filter="${1:-$(hostname)}"
    local api_base="https://leinad-log.deno.dev"
    
    echo "🔴 [LIVE] Starting live log monitor for: $location_filter"
    echo "Press Ctrl+C to stop"
    echo "=========================================="
    
    while true; do
        clear
        echo "🔴 [LIVE LOGS] $(date) - Location: $location_filter"
        echo "=========================================="
        
        local url="$api_base/logs?location=$location_filter&limit=10"
        if curl -s -H "Accept: application/json" "$url" | python3 -c "
import json
import sys
from datetime import datetime

try:
    data = json.load(sys.stdin)
    if isinstance(data, list):
        for item in data[-10:]:  # Last 10 items
            dt = item.get('datetime', 'No time')
            event = item.get('event', 'unknown')
            loc = item.get('location', 'unknown')
            mode = item.get('mode', 'unknown')
            print(f'🕒 {dt} | 📍 {loc} | 🎯 {event} | 📋 {mode}')
            if 'data' in item and item['data']:
                print(f'   📄 {str(item[\"data\"])[:100]}...')
    else:
        print('📋 No logs found or invalid format')
except Exception as e:
    print(f'❌ Error parsing logs: {e}')
" 2>/dev/null; then
            echo ""
        else
            echo "❌ Failed to fetch logs"
        fi
        
        echo "=========================================="
        echo "Refreshing in 5 seconds... (Ctrl+C to stop)"
        sleep 5
    done
}

# Show specific lines from a file  
show_lines() {
    local file="$1"
    local lines="$2"
    
    if [[ ! -f "$file" ]]; then
        echo "❌ Error: File $file not found"
        return 1
    fi
    
    echo "📄 [${file##*/}] Lines $lines:"
    echo "=========================================="
    
    # Handle different line range formats: 45,66 or 10-20 or just 15
    if [[ "$lines" =~ ^[0-9]+,[0-9]+$ ]]; then
        # Format: 45,66
        sed -n "${lines}p" "$file" | nl -ba -v${lines%,*}
    elif [[ "$lines" =~ ^[0-9]+-[0-9]+$ ]]; then
        # Format: 10-20
        local start=${lines%-*}
        local end=${lines#*-}
        sed -n "${start},${end}p" "$file" | nl -ba -v$start
    elif [[ "$lines" =~ ^[0-9]+$ ]]; then
        # Format: just 15
        sed -n "${lines}p" "$file" | nl -ba -v$lines
    else
        echo "❌ Error: Invalid line format. Use: 45,66 or 10-20 or 15"
        return 1
    fi
    
    echo "=========================================="
}

# Show git history and changes
show_history() {
    echo "📚 [REPO] Git commit history for JS files:"
    echo "=========================================="
    git log --oneline --follow classes/render.js classes/tracer.js | head -20
    echo "=========================================="
}

show_diff() {
    echo "📝 [REPO] Current changes vs last commit:"
    echo "=========================================="
    git diff classes/render.js classes/tracer.js
    echo "=========================================="
}

show_log() {
    local count="$1"
    echo "📜 [REPO] Last $count commits:"
    echo "=========================================="
    git log --oneline -n "$count" --pretty=format:"%h %ad %s" --date=short
    echo ""
    echo "=========================================="
}

show_commit() {
    local commit_hash="$1"
    echo "🔍 [REPO] Changes in commit $commit_hash:"
    echo "=========================================="
    git show "$commit_hash" -- classes/render.js classes/tracer.js
    echo "=========================================="
}

# Update version and date  
update_metadata() {
    local file="$1"
    local version="$2"
    
    # Remove any existing static VERSION/MODIFIED_DATE duplicates first
    sed -i '/^\s*static VERSION =/d' "$file"
    sed -i '/^\s*static MODIFIED_DATE =/d' "$file"
    
    # Add fresh versions after class line
    sed -i "/^class /a \\    static VERSION = \"$version\";" "$file"
    sed -i "/^class /a \\    static MODIFIED_DATE = \"$DATE\";" "$file"
}

case "$RESET$CHECK_ONLY$COMMENT_FROM$UNCOMMENT_FROM$EXTRACT_FUNC$ADD_METHOD_NAME$REPLACE_OLD$UPDATE_VERSION$SHOW_HISTORY$SHOW_DIFF$SHOW_LOG$SHOW_COMMIT" in
    "true"*) 
        reset_files
        exit 0
        ;;
    *"true"*)
        for file in $JS_FILES; do
            if [ -f "$file" ]; then
                validate_js "$file"
            fi
        done
        exit 0
        ;;
esac

# Handle git history commands
if [ "$SHOW_HISTORY" = true ]; then
    show_history
    exit 0
fi

if [ "$SHOW_DIFF" = true ]; then
    show_diff
    exit 0
fi

if [ -n "$SHOW_LOG" ]; then
    show_log "$SHOW_LOG"
    exit 0
fi

if [ -n "$SHOW_COMMIT" ]; then
    show_commit "$SHOW_COMMIT"
    exit 0
fi

if [ -n "$SHOW_LINES" ]; then
    # Determine which file to show lines from
    if [ -n "$TARGET_FILE" ]; then
        show_lines "$TARGET_FILE" "$SHOW_LINES"
    else
        echo "❌ Error: --lines requires --file parameter to specify which file"
        echo "Example: ./editor.sh --file render.js --lines 45,66"
    fi
    exit 0
fi

# Handle GitHub sync operations
if [ "$COMPARE_GITHUB" = true ]; then
    check_sync_status
    exit 0
fi

if [ "$SYNC_CHECK" = true ]; then
    auto_sync_all
    exit 0
fi

# Handle log checking
if [ -n "$CHECK_LOGS" ]; then
    check_deno_logs "$CHECK_LOGS"
    exit 0
fi

if [ "$LIVE_LOGS" = true ]; then
    live_log_monitor
    exit 0
fi

# Handle remove lines
if [ -n "$REMOVE_FROM" ] && [ -n "$REMOVE_TO" ]; then
    for file in $JS_FILES; do
        if [ -f "$file" ]; then
            remove_lines "$file" "$REMOVE_FROM" "$REMOVE_TO"
        fi
    done
fi

# Handle multiline replace
if [ -n "$MULTILINE_OLD" ] && [ -n "$MULTILINE_NEW" ]; then
    for file in $JS_FILES; do
        if [ -f "$file" ]; then
            multiline_replace "$file" "$MULTILINE_OLD" "$MULTILINE_NEW"
        fi
    done
fi

# Handle specific actions
if [ -n "$COMMENT_FROM" ] && [ -n "$COMMENT_TO" ]; then
    for file in $JS_FILES; do
        if [ -f "$file" ]; then
            comment_lines "$file" "$COMMENT_FROM" "$COMMENT_TO"
        fi
    done
fi

if [ -n "$UNCOMMENT_FROM" ] && [ -n "$UNCOMMENT_TO" ]; then
    for file in $JS_FILES; do
        if [ -f "$file" ]; then
            uncomment_lines "$file" "$UNCOMMENT_FROM" "$UNCOMMENT_TO"
        fi
    done
fi

if [ -n "$EXTRACT_FUNC" ]; then
    for file in $JS_FILES; do
        if [ -f "$file" ]; then
            extract_function "$file" "$EXTRACT_FUNC"
        fi
    done
    exit 0
fi

if [ -n "$ADD_METHOD_NAME" ] && [ -n "$ADD_METHOD_CODE" ]; then
    for file in $JS_FILES; do
        if [ -f "$file" ]; then
            echo "    $ADD_METHOD_CODE" >> "$file.tmp"
            echo "" >> "$file.tmp"
            sed '/^}$/d' "$file" >> "$file.tmp"
            echo "}" >> "$file.tmp"
            mv "$file.tmp" "$file"
        fi
    done
fi

if [ -n "$REPLACE_OLD" ] && [ -n "$REPLACE_NEW" ]; then
    for file in $JS_FILES; do
        if [ -f "$file" ]; then
            echo "🔄 [$file] Replacing '$REPLACE_OLD' with '$REPLACE_NEW'..."
            sed -i "s|$REPLACE_OLD|$REPLACE_NEW|g" "$file"
        fi
    done
fi

# Auto-increment versions and update metadata (only for --update)
if [ "$UPDATE_VERSION" = true ]; then
    for file in $ALL_JS_FILES; do
        if [ -f "$file" ]; then
            VERSION=$(auto_increment_version "$file")
            update_metadata "$file" "$VERSION"
            
            if validate_js "$file"; then
                echo "✓ [$file] Updated to v$VERSION ($DATE)"
            else
                echo "✗ [$file] Syntax error - reverting"
                git checkout "$file"
                exit 1
            fi
        fi
    done

    # Commit and push
    git add $ALL_JS_FILES
    git commit -m "Auto-update via editor.sh to v$VERSION ($DATE)"
    git push
    echo "✓ [REPO] Pushed to GitHub"
fi
