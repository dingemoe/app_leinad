#!/bin/bash
# Oppdaterer CDN_REGISTRY-objektet i render.js med innholdet fra cdn_registry.json

RENDER_FILE="classes/render.js"
JSON_FILE="classes/cdn_registry.json"

# Les innholdet fra JSON og lag JS-objekt
CDN_JS=$(jq -r 'to_entries | map("    \"" + .key + "\": \"" + .value + "\"") | join(",\n")' "$JSON_FILE")

# Sett innholdet inn i klassen (erstatt eksisterende this.CDN_REGISTRY = {...};)
awk -v cdnjs="$CDN_JS" '
    BEGIN {in_cdn=0}
    /this.CDN_REGISTRY\s*=\s*{/{
        print "        this.CDN_REGISTRY = {";
        print cdnjs;
        in_cdn=1;
        next
    }
    in_cdn && /};/ {
        print "        };";
        in_cdn=0;
        next
    }
    !in_cdn { print }
' "$RENDER_FILE" > "$RENDER_FILE.tmp" && mv "$RENDER_FILE.tmp" "$RENDER_FILE"

echo "CDN_REGISTRY i $RENDER_FILE er nå oppdatert fra $JSON_FILE."
