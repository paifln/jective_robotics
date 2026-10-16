param([Parameter(Mandatory=$true)][string]$ProjectId,[Parameter(Mandatory=$true)][string]$Service,[string]$Model,[string]$RailwayPath,[string]$ConfigurationDirectory)
$ErrorActionPreference='Stop'
if(-not $RailwayPath){$command=Get-Command railway -ErrorAction SilentlyContinue;if(-not $command){throw 'Provide the official Railway CLI path with -RailwayPath.'};$RailwayPath=$command.Source}
$railway=(Resolve-Path -LiteralPath $RailwayPath).Path
if($ProjectId -notmatch '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$' -or $Service -notmatch '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$'){throw 'Choose an explicit project ID and service name.'}
Write-Host "Destination: Railway project $ProjectId / service $Service / production"
Write-Host 'This command uploads encrypted provider material and its master to that server. It does not deploy or call OpenAI.'
if($ConfigurationDirectory){$setup=[pscustomobject]@{ConfigurationDirectory=(Resolve-Path -LiteralPath $ConfigurationDirectory).Path}}
else{if(-not $Model){throw 'Provide -Model for a new setup or -ConfigurationDirectory to retry the existing one.'};$setup=& (Join-Path $PSScriptRoot '../../setup-local.ps1') -Model $Model -PassThru}
if(-not $setup.ConfigurationDirectory){throw 'Local secure setup did not return a configuration directory.'}
& node (Join-Path $PSScriptRoot 'configure.mjs') $setup.ConfigurationDirectory $ProjectId $Service $railway
if($LASTEXITCODE -ne 0){throw 'Railway configuration failed; inspect the selected service privately. No deployment was requested.'}
Write-Host "Private local check credential: $($setup.ConfigurationDirectory)"
Write-Host 'Keep the existing local configuration for retry; do not create another credential if merely retrying an upload.'
