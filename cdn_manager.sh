#!/bin/bash
# cdn_manager.sh
# Sjekker om CDN-URLer eksisterer og kan legge til nye CDN i classes/render.js

RENDER_FILE="classes/render.js"

function check_cdn() {
    local name="$1"
    local url="$2"
    echo -n "Sjekker $name: $url ... "
    if curl -s --head --request GET "$url" | grep "200 OK" > /dev/null; then
        echo "OK"
    else
        echo "FEILET"
    fi
}

function list_cdns() {
    grep -Po '([a-zA-Z0-9_]+):\s*"https?://[^"]+"' "$RENDER_FILE" |
    while IFS= read -r line; do
        name=$(echo "$line" | cut -d: -f1)
        url=$(echo "$line" | cut -d\" -f2)
        check_cdn "$name" "$url"
    done
}

function add_cdn() {
    local name="$1"
    local url="$2"
    # Sett inn før siste } i CDN_REGISTRY
    awk -v n="$name" -v u="$url" '
        /this.CDN_REGISTRY\s*=\s*{/{
            print; in_cdn=1; next
        }
        in_cdn && /^\s*}/ {
            printf("    %s: \"%s\",\n", n, u)
            in_cdn=0
        }
        { print }
    ' "$RENDER_FILE" > "$RENDER_FILE.tmp" && mv "$RENDER_FILE.tmp" "$RENDER_FILE"
    echo "Lagt til $name: $url i $RENDER_FILE"
}

case "$1" in
    check)
        list_cdns
        ;;
    add)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Bruk: $0 add NAVN URL"
            exit 1
        fi
        add_cdn "$2" "$3"
        ;;
    *)
        echo "Bruk: $0 check | add NAVN URL"
        exit 1
        ;;
esac
