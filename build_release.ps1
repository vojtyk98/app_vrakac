$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "== Build release ==" -ForegroundColor Cyan

# (volitelné) JDK 17 – uprav cestu, pokud máš jinou
$java17 = "C:\Program Files\Eclipse Adoptium\jdk-17"
if (Test-Path $java17) {
  $env:JAVA_HOME = $java17
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

# sanity check
if (-not (Test-Path ".\android\gradlew")) { throw "Nenalezen android/gradlew. Spouštěj z KOŘENE projektu." }

# clean
Set-Location android
Remove-Item -Recurse -Force .\.gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\app\build -ErrorAction SilentlyContinue
.\gradlew clean
Set-Location ..

# bundle JS + assets
New-Item -ItemType Directory -Force .\android\app\src\main\assets | Out-Null
$entry = @("index.tsx","index.js","app\index.tsx","app\index.js") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $entry) { throw "Entry file nenalezen (čekám index.tsx nebo index.js)." }
Write-Host "Entry: $entry"
npx.cmd react-native bundle --platform android --dev false --entry-file $entry --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# APK
Set-Location android
.\gradlew :app:assembleRelease --no-daemon --info
if (Test-Path .\app\build\outputs\apk\release\app-release.apk) {
  Write-Host "APK: app\build\outputs\apk\release\app-release.apk" -ForegroundColor Green
} else {
  Write-Warning "APK se nevytvořilo."
}

# AAB
.\gradlew :app:bundleRelease --no-daemon --info
if (Test-Path .\app\build\outputs\bundle\release\app-release.aab) {
  Write-Host "AAB: app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Green
} else {
  Write-Warning "AAB se nevytvořilo."
}

Write-Host "== DONE ==" -ForegroundColor Cyan
