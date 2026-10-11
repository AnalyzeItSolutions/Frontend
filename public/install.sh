#!/bin/sh
# AnalyzeIt installer for macOS and Linux.
#
#   curl -fsSL https://www.analyzeit.in/install.sh | sh              # the command line
#   curl -fsSL https://www.analyzeit.in/install.sh | sh -s -- --app  # the desktop app
#
# Why this exists: files downloaded by a browser carry a "downloaded from the internet" flag that makes
# macOS show an unidentified-developer warning for builds that are not notarized. Files fetched by curl
# carry no such flag, so nothing is blocked. This script is short on purpose; read it before running it.
#
# What it does: downloads the build for your system over HTTPS, checks its SHA-256 against the list
# published by this site, and installs it. Future updates are checked against a signature built into the
# program itself (`analyzeit update`, or the app's own updater), so they do not rely on this script.
set -eu

BASE="${ANALYZEIT_DOWNLOAD_BASE:-https://www.analyzeit.in/downloads}"
WANT=cli

die() { printf 'analyzeit install: %s\n' "$1" >&2; exit 1; }

for arg in "$@"; do
  case "$arg" in
    --app) WANT=app ;;
    --cli) WANT=cli ;;
    -h|--help) sed -n '2,17p' "$0" 2>/dev/null || true; exit 0 ;;
    *) die "unknown option: $arg" ;;
  esac
done

case "$(uname -s)" in
  Darwin) OS=macos ;;
  Linux) OS=linux ;;
  *) die "this script is for macOS and Linux. On Windows use install.ps1: https://www.analyzeit.in/download" ;;
esac
case "$(uname -m)" in
  arm64|aarch64) ARCH=arm64 ;;
  x86_64|amd64) ARCH=x64 ;;
  *) die "unsupported processor: $(uname -m)" ;;
esac
[ "$OS" = linux ] && [ "$ARCH" != x64 ] && die "Linux builds are x86-64 only for now"

command -v curl >/dev/null 2>&1 || die "curl is required"
if command -v sha256sum >/dev/null 2>&1; then SHA="sha256sum"; elif command -v shasum >/dev/null 2>&1; then SHA="shasum -a 256"; else die "sha256sum or shasum is required"; fi

if [ "$WANT" = cli ]; then PRODUCT=cli; KIND=binary
elif [ "$OS" = macos ]; then PRODUCT=desktop; KIND=app-update
else PRODUCT=desktop; KIND=appimage; fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT INT TERM

curl -fsSL --proto '=https' --tlsv1.2 "$BASE/install.txt" -o "$TMP/list" || die "could not read the release list"
LINE="$(awk -v p="$PRODUCT" -v o="$OS" -v a="$ARCH" -v k="$KIND" '$1==p && $2==o && ($2!="macos" || $3==a) && $4==k { print; exit }' "$TMP/list")"
[ -n "$LINE" ] || die "no $WANT build is published for $OS $ARCH yet"
WANT_SUM="$(printf '%s' "$LINE" | awk '{print $5}')"
URL="$(printf '%s' "$LINE" | awk '{print $7}')"
case "$URL" in https://*) ;; *) die "the release list contains a non-https address" ;; esac

printf 'Downloading AnalyzeIt (%s, %s %s)...\n' "$WANT" "$OS" "$ARCH"
if [ -t 2 ]; then PROGRESS="-#"; else PROGRESS="-sS"; fi
curl -fL --proto '=https' --tlsv1.2 $PROGRESS "$URL" -o "$TMP/file" || die "download failed"
GOT_SUM="$($SHA "$TMP/file" | awk '{print $1}')"
[ "$GOT_SUM" = "$WANT_SUM" ] || die "checksum mismatch; nothing was installed"

if [ "$WANT" = cli ]; then
  if [ -w /usr/local/bin ] 2>/dev/null; then DIR=/usr/local/bin; else DIR="$HOME/.local/bin"; mkdir -p "$DIR"; fi
  install -m 755 "$TMP/file" "$DIR/analyzeit"
  printf 'Installed %s/analyzeit\n' "$DIR"
  case ":$PATH:" in *":$DIR:"*) ;; *) printf 'Add %s to your PATH to run it as: analyzeit\n' "$DIR" ;; esac
  printf 'Next: analyzeit login    (opens your browser)\n'
elif [ "$OS" = macos ]; then
  if [ -w /Applications ]; then DEST=/Applications; else DEST="$HOME/Applications"; mkdir -p "$DEST"; fi
  mkdir "$TMP/x" && tar -xzf "$TMP/file" -C "$TMP/x"
  [ -d "$TMP/x/AnalyzeIt.app" ] || die "the download did not contain the app"
  rm -rf "$DEST/AnalyzeIt.app"
  cp -R "$TMP/x/AnalyzeIt.app" "$DEST/AnalyzeIt.app"
  printf 'Installed %s/AnalyzeIt.app\nOpen it from Launchpad or: open "%s/AnalyzeIt.app"\n' "$DEST" "$DEST"
else
  DIR="$HOME/.local/bin"; mkdir -p "$DIR"
  install -m 755 "$TMP/file" "$DIR/AnalyzeIt.AppImage"
  printf 'Installed %s/AnalyzeIt.AppImage\nRun it with: %s/AnalyzeIt.AppImage\n' "$DIR" "$DIR"
fi
