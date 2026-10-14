param([string]$Destination = (Join-Path $env:APPDATA 'jective-robotics-studio\toolchain'))
$ErrorActionPreference='Stop'
$Destination=[System.IO.Path]::GetFullPath($Destination)
$repoRoot=Split-Path $PSScriptRoot -Parent
$cli=Join-Path $repoRoot '.toolchain/bin/arduino-cli.exe'
if(!(Test-Path -LiteralPath $cli)){throw 'Download Arduino CLI 1.5.1 from the official release and verify its checksum first; see docs/TOOLCHAIN.md.'}
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$configuration=@{directories=@{data=(Join-Path $Destination 'data');downloads=(Join-Path $Destination 'downloads');user=(Join-Path $Destination 'user')};board_manager=@{additional_urls=@('https://espressif.github.io/arduino-esp32/package_esp32_index.json')}}
$config=Join-Path $Destination 'arduino-cli.yaml'
$configuration | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $config -Encoding utf8
& $cli core update-index --config-file $config
if($LASTEXITCODE -ne 0){throw 'Package indexes failed'}
& $cli core install esp32:esp32@3.3.12 --config-file $config
if($LASTEXITCODE -ne 0){throw 'Core install failed'}
Write-Output "Prepared application-owned toolchain at $Destination"
