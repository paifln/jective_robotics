param([switch]$Uninstall,[string]$Version)
$ErrorActionPreference='Stop'
$workspaceRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $Version) { $Version=(Get-Content -LiteralPath (Join-Path $workspaceRoot 'package.json') -Encoding utf8 -Raw | ConvertFrom-Json).version }
if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw 'Unsupported verification version' }
$evidenceDirectory=Join-Path $workspaceRoot ('evidence\releases\'+$Version)
New-Item -ItemType Directory -Path $evidenceDirectory -Force | Out-Null
$targetDirectory=Join-Path $workspaceRoot ('.verification\'+[char]0x0416+' Studio verification '+$Version)
$resolvedTarget=[IO.Path]::GetFullPath($targetDirectory)
if (-not $resolvedTarget.StartsWith($workspaceRoot+'\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Verification target escapes workspace' }
$installerPath=Join-Path $workspaceRoot ('release\JECTIVE Robotics Studio Setup '+$Version+'.exe')
$started=(Get-Date).ToUniversalTime().ToString('o')
if ($Uninstall) {
 $uninstallerPath=Join-Path $targetDirectory 'Uninstall JECTIVE Robotics Studio.exe'
 if (-not (Test-Path -LiteralPath $uninstallerPath)) { throw 'Verification uninstaller not found' }
 $process=Start-Process -FilePath $uninstallerPath -ArgumentList '/S' -WindowStyle Hidden -PassThru -Wait
 $record=@{operation='isolated local uninstall';started=$started;finished=(Get-Date).ToUniversalTime().ToString('o');exitCode=$process.ExitCode;target=$targetDirectory;executableRemains=(Test-Path -LiteralPath (Join-Path $targetDirectory 'JECTIVE Robotics Studio.exe'));cleanWindows10='NOT RUN';separateStandardUser='NOT RUN'}
 $record | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $evidenceDirectory 'uninstallation.json')
} else {
 $process=Start-Process -FilePath $installerPath -ArgumentList '/currentuser','/S',('/D='+$targetDirectory) -WindowStyle Hidden -PassThru -Wait
 $record=@{operation='isolated local per-user install';started=$started;finished=(Get-Date).ToUniversalTime().ToString('o');exitCode=$process.ExitCode;target=$targetDirectory;executableExists=(Test-Path -LiteralPath (Join-Path $targetDirectory 'JECTIVE Robotics Studio.exe'));osBuild=[Environment]::OSVersion.Version.ToString();cleanWindows10='NOT RUN';separateStandardUser='NOT RUN'}
 $record | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $evidenceDirectory 'installation.json')
}
if ($process.ExitCode -ne 0) { throw ('Installer lifecycle command failed: '+$process.ExitCode) }
$record | ConvertTo-Json
