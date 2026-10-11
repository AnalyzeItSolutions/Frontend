#!/bin/bash
# Renders the reel: 1080x1920, 30 s, to reel.mp4. Usage: scripts/social/reel/render.sh [fps]  (default 15, output interpolated to 30 fps)
set -euo pipefail
cd "$(dirname "$0")"
FPS=${1:-15}
OUT=$(mktemp -d)
node --experimental-websocket capture.mjs "$OUT" "$FPS" 30
ffmpeg -y -loglevel error -framerate "$FPS" -i "$OUT/f%04d.png" -vf "minterpolate=fps=30:mi_mode=blend,format=yuv420p" -c:v libx264 -crf 18 -movflags +faststart reel.mp4
echo "wrote $PWD/reel.mp4"
