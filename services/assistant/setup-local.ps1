param([Parameter(Mandatory=$true)][string]$Model,[ValidateRange(1,65535)][int]$Port=8787,[Security.SecureString]$ProviderKey,[switch]$PassThru)
$ErrorActionPreference='Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This setup uses Windows user encryption.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 24 before setup.' }
$setupId=[Guid]::NewGuid().ToString('N')
$dataRoot=Join-Path $env:LOCALAPPDATA "JectiveAssistant\$setupId"
$masterRoot=Join-Path $env:LOCALAPPDATA "JectiveAssistantMaster\$setupId"
$owner=[System.Security.Principal.WindowsIdentity]::GetCurrent().User
foreach($directory in @($dataRoot,$masterRoot)) {
 [void][System.IO.Directory]::CreateDirectory($directory)
 $acl=New-Object System.Security.AccessControl.DirectorySecurity
 $acl.SetAccessRuleProtection($true,$false)
 $acl.SetOwner($owner)
 $rule=New-Object System.Security.AccessControl.FileSystemAccessRule($owner,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
 $acl.AddAccessRule($rule)
 Set-Acl -LiteralPath $directory -AclObject $acl
}
$names=@('OPENAI_API_KEY','JECTIVE_SETUP_DATA','JECTIVE_SETUP_MASTER','JECTIVE_SETUP_MODEL','JECTIVE_SETUP_PORT')
$previous=@{};foreach($name in $names){$previous[$name]=[Environment]::GetEnvironmentVariable($name,'Process')}
$secureKey=$ProviderKey
if($null -eq $secureKey){$secureKey=Read-Host 'OpenAI API key (hidden; do not paste it into chat)' -AsSecureString}
$pointer=[IntPtr]::Zero
try {
 $pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
 $env:OPENAI_API_KEY=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
 $env:JECTIVE_SETUP_DATA=$dataRoot;$env:JECTIVE_SETUP_MASTER=$masterRoot;$env:JECTIVE_SETUP_MODEL=$Model;$env:JECTIVE_SETUP_PORT=[string]$Port
 $raw=& node (Join-Path $PSScriptRoot 'setup-local.mjs') prepare
 if($LASTEXITCODE -ne 0){throw 'Setup failed; no server started.'}
 $result=$raw | ConvertFrom-Json
 $protected=ConvertTo-SecureString -String $result.token -AsPlainText -Force
 $protected | ConvertFrom-SecureString | Set-Content -LiteralPath (Join-Path $dataRoot 'learner.token.dpapi') -Encoding ASCII
 $protected.Dispose();$result.token=$null;$raw=$null
 Write-Host "Prepared private local configuration: $dataRoot"
 Write-Host "Start server: node services/assistant/setup-local.mjs start `"$(Join-Path $dataRoot 'runtime.json')`""
 Write-Host 'No OpenAI request was sent. This is a local administrator check, not a public deployment.'
 if($PassThru){[pscustomobject]@{ConfigurationDirectory=$dataRoot;MasterDirectory=$masterRoot}}
} finally {
 foreach($name in $names){[Environment]::SetEnvironmentVariable($name,$previous[$name],'Process')}
 if($pointer -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}
 $secureKey.Dispose()
}
