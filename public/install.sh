#!/bin/sh
# AnalyzeIt installer for macOS and Linux.
#
#   curl -fsSL https://www.analyzeit.si/install.sh | sh
#   curl -fsSL https://www.analyzeit.si/install.sh | sh -s -- --no-plugin --no-browser
#
# Read it before you run it; it is short on purpose. What it does, in order:
#   1. detects your system (macOS arm64/x64, Linux x64) and refuses anything else
#   2. downloads the list of published builds (install.txt) over HTTPS and, if `minisign` is installed,
#      verifies the list's signature against the key embedded below (--require-signature makes that mandatory)
#   3. downloads the build and checks its SHA-256 against that list; on any mismatch nothing is installed
#   4. installs the `analyzeit` command (no admin rights; ~/.local/bin unless --dir says otherwise)
#   5. registers it with Claude (Claude Code and Claude Desktop, when present) as the "analyzeit" tool server,
#      which runs `analyzeit mcp`: Claude gets computed results only, never your rows (see `analyzeit policy`)
#   6. opens the extension's store page in your default browser (skipped when no listing is published)
# Your data stays on this computer. Nothing here sends any of it anywhere.
#
# Options: --dir DIR  --no-plugin  --no-browser  --require-signature  --dry-run  -h
# Environment: ANALYZEIT_DOWNLOAD_BASE (default https://www.analyzeit.si/downloads), ANALYZEIT_INSTALL_DIR
set -eu

BASE="${ANALYZEIT_DOWNLOAD_BASE:-https://www.analyzeit.si/downloads}"
DIR="${ANALYZEIT_INSTALL_DIR:-}"
PLUGIN=1
BROWSER=1
REQUIRE_SIG=0
DRY=0

# minisign public key of the release signer: the same key `analyzeit update` and the desktop updater trust.
# (2nd line of the .pub file, i.e. the base64 key itself.)
MINISIGN_PUBKEY="RWT6aOPIR+JVl9Na6vTD44LGVrqVP/Y9fH8LfMJDbK+/Y2xhEU2bCBKm"

say() { printf '%s\n' "$*"; }
die() { printf 'analyzeit install: %s\n' "$1" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --dir) [ $# -ge 2 ] || die "--dir needs a folder"; DIR="$2"; shift ;;
    --no-plugin) PLUGIN=0 ;;
    --no-browser) BROWSER=0 ;;
    --require-signature) REQUIRE_SIG=1 ;;
    --dry-run) DRY=1 ;;
    -h|--help) sed -n '2,20p' "$0" 2>/dev/null || true; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
  shift
done

# ------------------------------------------------------------------ the download address
# HTTPS only. Plain http is accepted solely for this computer, so tests can use a local stub server.
case "$BASE" in
  https://*) LOCAL=0 ;;
  http://127.0.0.1:*|http://127.0.0.1/*|http://localhost:*|http://localhost/*) LOCAL=1 ;;
  *) die "the download address must start with https://" ;;
esac
BASE="${BASE%/}"

# ------------------------------------------------------------------ system
OS="$(uname -s)"
MACH="$(uname -m)"
if [ "$LOCAL" = 1 ] && [ -n "${ANALYZEIT_TEST_TARGET:-}" ]; then
  OS="${ANALYZEIT_TEST_TARGET%%/*}"; MACH="${ANALYZEIT_TEST_TARGET##*/}"
fi
case "$OS" in
  Darwin) OS=macos ;;
  Linux) OS=linux ;;
  *) die "this script is for macOS and Linux. On Windows use install.ps1: https://www.analyzeit.si/download" ;;
esac
case "$MACH" in
  arm64|aarch64) ARCH=arm64 ;;
  x86_64|amd64) ARCH=x64 ;;
  *) die "unsupported processor: $MACH" ;;
esac
[ "$OS" = linux ] && [ "$ARCH" != x64 ] && die "Linux builds are x86-64 only for now"

command -v curl >/dev/null 2>&1 || die "curl is required"
if command -v sha256sum >/dev/null 2>&1; then SHA="sha256sum"
elif command -v shasum >/dev/null 2>&1; then SHA="shasum -a 256"
else die "sha256sum or shasum is required"; fi

if [ -z "$DIR" ]; then
  if [ -w /usr/local/bin ] 2>/dev/null; then DIR=/usr/local/bin; else DIR="${HOME:?}/.local/bin"; fi
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT INT TERM

fetch() { # url out
  if [ "$LOCAL" = 1 ]; then curl -fsSL "$1" -o "$2"; else curl -fsSL --proto '=https' --tlsv1.2 "$1" -o "$2"; fi
}

# ------------------------------------------------------------------ the list of builds, and its signature
fetch "$BASE/install.txt" "$TMP/list" || die "could not read the list of releases"

SIGNED=no
if fetch "$BASE/install.txt.minisig" "$TMP/list.minisig" 2>/dev/null; then
  if command -v minisign >/dev/null 2>&1; then
    minisign -Vm "$TMP/list" -P "$MINISIGN_PUBKEY" -x "$TMP/list.minisig" >/dev/null 2>&1 \
      || die "the release list's signature is not valid; nothing was installed"
    SIGNED=yes
  fi
fi
if [ "$SIGNED" != yes ]; then
  [ "$REQUIRE_SIG" = 0 ] || die "--require-signature needs the 'minisign' tool and a signed release list (brew install minisign)"
  say "Note: the release list's signature was not checked (install 'minisign' to check it). The SHA-256 below still is."
fi

LINE="$(awk -v o="$OS" -v a="$ARCH" '$1=="cli" && $2==o && ($2!="macos" || $3==a) && $4=="binary" { print; exit }' "$TMP/list")"
[ -n "$LINE" ] || die "no build is published for $OS $ARCH yet"
WANT_SUM="$(printf '%s' "$LINE" | awk '{print $5}')"
URL="$(printf '%s' "$LINE" | awk '{print $7}')"
case "$URL" in
  https://*) ;;
  http://127.0.0.1:*|http://localhost:*) [ "$LOCAL" = 1 ] || die "the release list contains a non-https address" ;;
  *) die "the release list contains a non-https address" ;;
esac
case "$WANT_SUM" in
  *[!0-9a-f]*|"") die "the release list has a malformed checksum" ;;
esac
[ "${#WANT_SUM}" = 64 ] || die "the release list has a malformed checksum"

say "AnalyzeIt for $OS $ARCH -> $DIR/analyzeit"
if [ "$DRY" = 1 ]; then
  say "Dry run: would download $URL (SHA-256 $WANT_SUM) and change nothing else."
  exit 0
fi

# ------------------------------------------------------------------ download and verify
fetch "$URL" "$TMP/analyzeit" || die "download failed"
GOT_SUM="$($SHA "$TMP/analyzeit" | awk '{print $1}')"
if [ "$GOT_SUM" != "$WANT_SUM" ]; then
  die "checksum mismatch (expected $WANT_SUM, got $GOT_SUM); nothing was installed"
fi

# ------------------------------------------------------------------ install
mkdir -p "$DIR"
install -m 755 "$TMP/analyzeit" "$DIR/analyzeit.new"
mv -f "$DIR/analyzeit.new" "$DIR/analyzeit"
say "Installed $DIR/analyzeit (SHA-256 verified)."
case ":$PATH:" in *":$DIR:"*) ;; *) say "Add $DIR to your PATH to run it as: analyzeit" ;; esac

# ------------------------------------------------------------------ register with Claude
register_claude() {
  did=0
  if command -v claude >/dev/null 2>&1; then
    claude mcp remove analyzeit --scope user >/dev/null 2>&1 || true
    if claude mcp add --scope user analyzeit -- "$DIR/analyzeit" mcp >/dev/null 2>&1; then
      say "Registered with Claude Code (user scope). In Claude Code, /mcp lists \"analyzeit\"."
      did=1
    else
      say "Could not register with Claude Code. Run: claude mcp add --scope user analyzeit -- $DIR/analyzeit mcp"
    fi
  fi
  case "$OS" in
    macos) CFG_DIR="${HOME:?}/Library/Application Support/Claude" ;;
    *) CFG_DIR="${HOME:?}/.config/Claude" ;;
  esac
  if [ -d "$CFG_DIR" ]; then
    CFG="$CFG_DIR/claude_desktop_config.json"
    if command -v python3 >/dev/null 2>&1; then
      if python3 - "$CFG" "$DIR/analyzeit" <<'PY'
import json, os, shutil, sys
path, exe = sys.argv[1], sys.argv[2]
cfg = {}
if os.path.exists(path):
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    cfg = json.loads(raw) if raw.strip() else {}
    if not isinstance(cfg, dict):
        sys.exit(1)
    shutil.copy2(path, path + ".analyzeit-backup")
servers = cfg.setdefault("mcpServers", {})
if not isinstance(servers, dict):
    sys.exit(1)
servers["analyzeit"] = {"command": exe, "args": ["mcp"]}
tmp = path + ".analyzeit-tmp"
with open(tmp, "w", encoding="utf-8") as f:
    json.dump(cfg, f, indent=2)
    f.write("\n")
os.replace(tmp, path)
PY
      then
        say "Registered with Claude Desktop (a backup of your config is next to it). Restart Claude Desktop to see it."
        did=1
      else
        say "Could not edit $CFG safely; add this under \"mcpServers\": \"analyzeit\": {\"command\": \"$DIR/analyzeit\", \"args\": [\"mcp\"]}"
      fi
    else
      say "Claude Desktop found, but python3 is not available to edit its config. Add under \"mcpServers\": \"analyzeit\": {\"command\": \"$DIR/analyzeit\", \"args\": [\"mcp\"]}"
    fi
  fi
  [ "$did" = 1 ] || say "Claude was not found. Later, run: claude mcp add --scope user analyzeit -- $DIR/analyzeit mcp"
}
# `analyzeit mcp` exists from 0.5.1; an older build would read it as a question, so do not register that one.
HAS_MCP=0
GOT_VER="$("$DIR/analyzeit" --version 2>/dev/null | awk '{print $2}')"
case "$GOT_VER" in
  0.[0-4].*|0.5.0|"") ;;
  *) HAS_MCP=1 ;;
esac
if [ "$PLUGIN" = 1 ] && [ "$HAS_MCP" = 0 ]; then say "This build has no assistant (mcp) support yet, so Claude was not registered. A later update adds it."
elif [ "$PLUGIN" = 1 ]; then register_claude; else say "Skipped registering with Claude (--no-plugin)."; fi

# ------------------------------------------------------------------ the browser extension
default_browser() {
  if [ -n "${ANALYZEIT_TEST_BROWSER:-}" ] && [ "$LOCAL" = 1 ]; then printf '%s' "$ANALYZEIT_TEST_BROWSER"; return; fi
  b=""
  if [ "$OS" = macos ]; then
    id="$(defaults read com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers 2>/dev/null \
      | awk '/LSHandlerRoleAll/ {r=$3} /LSHandlerURLScheme = https/ {print r; exit}' | tr -d '";' | tr 'A-Z' 'a-z')"
    case "$id" in
      com.google.chrome*|com.brave.browser*|com.microsoft.edgemac*|org.chromium*|com.vivaldi*|company.thebrowser*) b=chromium ;;
      org.mozilla.firefox*|org.mozilla.*) b=firefox ;;
      com.apple.safari*) b=safari ;;
    esac
  else
    d="$(xdg-settings get default-web-browser 2>/dev/null | tr 'A-Z' 'a-z')"
    case "$d" in
      *chrom*|*brave*|*edge*|*vivaldi*|*opera*) b=chromium ;;
      *firefox*) b=firefox ;;
    esac
  fi
  printf '%s' "$b"
}

open_url() {
  if [ "$OS" = macos ]; then open "$1" 2>/dev/null; else xdg-open "$1" >/dev/null 2>&1; fi
}

if [ "$BROWSER" = 1 ]; then
  B="$(default_browser)"
  # Store pages come from the signed release list (lines "extension <browser> any store 0 0 <url>"), so the address
  # is the one the release signer published, and nothing is opened until a listing exists.
  EXT="$(awk -v b="$B" '$1=="extension" && $2==b { print $7; exit }' "$TMP/list")"
  case "$EXT" in
    https://*)
      say "Opening the AnalyzeIt extension page for your browser: $EXT"
      open_url "$EXT" || say "Open it yourself: $EXT"
      ;;
    *)
      if [ -z "$B" ]; then say "Could not tell which browser is your default; the extension page is not opened."
      else say "The browser extension is not in the $B store yet, so nothing was opened. It is optional (it fills posts you approve)."; fi
      ;;
  esac
else
  say "Skipped opening the extension page (--no-browser)."
fi

say ""
say "Done. Try: analyzeit policy   (what stays on this computer)"
say "      analyzeit data import <file>; analyzeit data share <dataset> on   (then ask Claude about it)"
