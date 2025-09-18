#!/bin/bash
# Oppdaterer versjonsnummer og modified date i render.js og tracer.js
# Bruk: ./update_classmeta.sh <versjon>

set -e

VERSION="$1"
DATE="$(date +%Y-%m-%d)"


for FILE in classes/render.js classes/tracer.js; do
  if [ -f "$FILE" ]; then
    # Sjekk om static VERSION finnes
    if grep -q "static VERSION =" "$FILE"; then
      sed -i "s/^\s*static VERSION = \"[^"]*\";/    static VERSION = \"$VERSION\";/" "$FILE"
    else
      # Sett inn etter class-linjen
      sed -i "/^class /a \\    static VERSION = \"$VERSION\";" "$FILE"
    fi
    # Sjekk om static MODIFIED_DATE finnes
    if grep -q "static MODIFIED_DATE =" "$FILE"; then
      sed -i "s/^\s*static MODIFIED_DATE = \"[^"]*\";/    static MODIFIED_DATE = \"$DATE\";/" "$FILE"
    else
      sed -i "/^class /a \\    static MODIFIED_DATE = \"$DATE\";" "$FILE"
    fi
    echo "Oppdatert $FILE til v$VERSION ($DATE)"
  fi
done

# Legg til, commit og push endringene til git
git add classes/render.js classes/tracer.js
git commit -m "Oppdater versjon til v$VERSION ($DATE) automatisk via update_classmeta.sh"
git push
