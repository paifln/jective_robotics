param([string]$Version)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$workspaceRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $Version) { $Version=(Get-Content -LiteralPath (Join-Path $workspaceRoot 'package.json') -Encoding utf8 -Raw | ConvertFrom-Json).version }
if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw 'Unsupported verification version' }
$evidenceDirectory=Join-Path $workspaceRoot ('evidence\releases\'+$Version)
New-Item -ItemType Directory -Path $evidenceDirectory -Force | Out-Null
$archivePath=Join-Path $workspaceRoot ('release\JECTIVE-Robotics-Studio-'+$Version+'-source.zip')
$paths=@(git -C $workspaceRoot ls-files --cached --others --exclude-standard)
$paths+=@(Get-ChildItem -LiteralPath (Join-Path $workspaceRoot 'evidence') -File -Recurse | ForEach-Object { $_.FullName.Substring($workspaceRoot.Length+1).Replace('\','/') })
$stream=[IO.File]::Open($archivePath,[IO.FileMode]::Create,[IO.FileAccess]::Write)
$archive=New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Create,$false)
$count=0
try {
 foreach($relativePath in ($paths | Sort-Object -Unique | Where-Object { $_ -ne 'evidence/source-artifact.json' -and $_ -ne ('evidence/releases/'+$Version+'/source-artifact.json') -and $_ -ne ('evidence/releases/'+$Version+'/source-verification.json') })) {
  if ($relativePath -match '(^|/)\.\.(\/|$)' -or [IO.Path]::IsPathRooted($relativePath)) { throw 'Unsafe source export path' }
  $absolutePath=[IO.Path]::GetFullPath((Join-Path $workspaceRoot $relativePath))
  if (-not $absolutePath.StartsWith($workspaceRoot+'\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Source export escapes workspace' }
  $item=Get-Item -LiteralPath $absolutePath
  if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse point not allowed in source export' }
  if (-not $item.PSIsContainer) { [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$absolutePath,$relativePath.Replace('\','/'),[IO.Compression.CompressionLevel]::Optimal) | Out-Null; $count++ }
 }
} finally { $archive.Dispose();$stream.Dispose() }
@{file=$archivePath;files=$count;size=(Get-Item -LiteralPath $archivePath).Length;sha256=(Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()} | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $evidenceDirectory 'source-artifact.json')
