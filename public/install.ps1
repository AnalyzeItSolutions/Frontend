# AnalyzeIt installer for Windows (PowerShell).
#
#   irm https://www.analyzeit.si/install.ps1 | iex                  # the command line
#   & ([scriptblock]::Create((irm https://www.analyzeit.si/install.ps1))) -App   # the desktop app
#
# Files downloaded by a browser carry a "downloaded from the internet" mark that makes SmartScreen warn
# about publishers it does not know yet. Files fetched by PowerShell carry no such mark. This script is
# short on purpose; read it before running it. It downloads over HTTPS, checks the SHA-256 against the list
# published by this site, and installs for your user only (no administrator rights needed).
param([switch]$App)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Base = if ($env:ANALYZEIT_DOWNLOAD_BASE) { $env:ANALYZEIT_DOWNLOAD_BASE } else { 'https://www.analyzeit.si/downloads' }

function Fail($m) { Write-Error "analyzeit install: $m"; exit 1 }

if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') { Fail "Windows builds are x64 only for now" }
$product = if ($App) { 'desktop' } else { 'cli' }
$kind = if ($App) { 'exe' } else { 'binary' }

$list = (Invoke-RestMethod -Uri "$Base/install.txt" -UseBasicParsing) -split "`n" | Where-Object { $_ }
$line = $list | Where-Object { $f = $_ -split ' '; $f[0] -eq $product -and $f[1] -eq 'windows' -and $f[3] -eq $kind } | Select-Object -First 1
if (-not $line) { Fail "no $product build is published for Windows yet" }
$f = $line -split ' '
$sum = $f[4]; $url = $f[6]
if (-not $url.StartsWith('https://')) { Fail 'the release list contains a non-https address' }

$tmp = Join-Path ([IO.Path]::GetTempPath()) ("analyzeit-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  $file = Join-Path $tmp ([IO.Path]::GetFileName(([Uri]$url).AbsolutePath))
  Write-Host "Downloading AnalyzeIt ($product, Windows x64)..."
  Invoke-WebRequest -Uri $url -OutFile $file -UseBasicParsing
  $got = (Get-FileHash -Algorithm SHA256 -Path $file).Hash.ToLower()
  if ($got -ne $sum) { Fail 'checksum mismatch; nothing was installed' }

  if ($App) {
    Write-Host 'Starting the installer...'
    Start-Process -FilePath $file -Wait
  } else {
    $dir = Join-Path $env:LOCALAPPDATA 'AnalyzeIt\bin'
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Copy-Item -Force $file (Join-Path $dir 'analyzeit.exe')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if (($userPath -split ';') -notcontains $dir) {
      [Environment]::SetEnvironmentVariable('Path', ($userPath.TrimEnd(';') + ';' + $dir), 'User')
      Write-Host "Added $dir to your PATH. Open a new terminal to use it."
    }
    Write-Host "Installed $dir\analyzeit.exe"
    Write-Host 'Next: analyzeit login    (opens your browser)'
  }
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
