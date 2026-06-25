$ErrorActionPreference = 'Stop'

$workspace = Split-Path -Parent $PSScriptRoot
$cargoBin = Join-Path $env:USERPROFILE '.cargo\bin'

if (Test-Path $cargoBin) {
  $env:Path = "$cargoBin;$env:Path"
}

Set-Location $workspace

Write-Host '1/3 安装依赖...'
npm install --install-strategy=shallow --no-audit --no-fund

Write-Host '2/3 构建前端资源...'
npm run build

Write-Host '3/3 打包桌面版...'
npm run desktop:build

Write-Host '打包结束，请到 src-tauri/target/release/bundle/ 查看产物。'
