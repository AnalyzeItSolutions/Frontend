#!/usr/bin/env bash
# Hosts the Vosk speech model the web app runs in the browser (app/lib/deviceSpeech.ts) in the public download storage, and lets the
# site's pages fetch it (CORS GET from the site's origins only). Run once per model; re-running is harmless.
#
#   frontend/scripts/host-speech-model.sh [vosk-model-small-en-us-0.15]
#
# Needs az (logged in). The model comes from its publisher (alphacephei.com), is checked against the pinned SHA-256, and is repacked
# as .tar.gz with its folder at the top (what vosk-browser reads).
set -euo pipefail

MODEL="${1:-vosk-model-small-en-us-0.15}"
case "$MODEL" in
  vosk-model-small-en-us-0.15) SHA=30f26242c4eb449f948e42cb302dd7a686cb29a3423a8367f99ff41780942498 ;;
  *) echo "unknown model $MODEL (add its SHA-256 here first)" >&2; exit 2 ;;
esac
ACCOUNT=stanalyzeitdl RG=analyzeit-rg CONTAINER=downloads
ORIGINS="https://www.analyzeit.si https://analyzeit.si https://www.analyzeit.in https://analyzeit.in"

work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
curl -fsSL -o "$work/m.zip" "https://alphacephei.com/vosk/models/$MODEL.zip"
echo "$SHA  $work/m.zip" | shasum -a 256 -c -
(cd "$work" && unzip -q m.zip && tar czf "$MODEL.tar.gz" "$MODEL")

key="$(az storage account keys list -n "$ACCOUNT" -g "$RG" --query '[0].value' -o tsv)"
az storage blob upload --account-name "$ACCOUNT" --account-key "$key" -c "$CONTAINER" -n "models/$MODEL.tar.gz" -f "$work/$MODEL.tar.gz" \
  --overwrite --content-type application/gzip --content-cache-control "public, max-age=31536000, immutable" --only-show-errors -o none
# Blob CORS: GET/HEAD from the site only. Added once (an identical rule is not added twice).
if ! az storage cors list --account-name "$ACCOUNT" --account-key "$key" --services b -o tsv --query "[?contains(allowedOrigins, 'analyzeit.si')]" | grep -q .; then
  az storage cors add --account-name "$ACCOUNT" --account-key "$key" --services b --methods GET HEAD --origins $ORIGINS \
    --allowed-headers '*' --exposed-headers 'Content-Length' --max-age 86400 --only-show-errors
fi
echo "https://$ACCOUNT.blob.core.windows.net/$CONTAINER/models/$MODEL.tar.gz"
