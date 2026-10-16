$ErrorActionPreference='Stop'
# Synthetic administrator-only verification. Never prompts for or uses a real key.
[void][IO.Directory]::CreateDirectory((Join-Path (Get-Location) '.verification'))
$errorsFound=$null;$tokensFound=$null
foreach($file in @('services/assistant/setup-local.ps1','services/assistant/connect-local-app.ps1')){
 [void][System.Management.Automation.Language.Parser]::ParseFile((Join-Path (Get-Location) $file),[ref]$tokensFound,[ref]$errorsFound)
 if($errorsFound.Count){throw ($errorsFound | Out-String)}
}
$fixtureRoot=Join-Path ([IO.Path]::GetTempPath()) ('jective-setup-wizard-'+[guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($fixtureRoot)
$oldData=$env:LOCALAPPDATA
try{
 $env:LOCALAPPDATA=$fixtureRoot
 $fake=ConvertTo-SecureString -String 'explicit-fake-provider-wizard' -AsPlainText -Force
 $metadata=& ./services/assistant/setup-local.ps1 -Model 'fixture' -Port 18787 -ProviderKey $fake -PassThru
 if(-not $metadata.ConfigurationDirectory -or -not $metadata.MasterDirectory){throw 'Private setup metadata was not returned'}
 $directory=Get-ChildItem -LiteralPath (Join-Path $fixtureRoot 'JectiveAssistant') -Directory | Select-Object -First 1
 $master=Get-ChildItem -LiteralPath (Join-Path $fixtureRoot 'JectiveAssistantMaster') -Directory | Select-Object -First 1
 foreach($item in @($directory,$master)){
  $acl=Get-Acl -LiteralPath $item.FullName
  if(-not $acl.AreAccessRulesProtected){throw 'Inherited permissions were not disabled'}
  $ownerSid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  foreach($rule in $acl.Access){if($rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -ne $ownerSid){throw 'Unexpected ACL principal'}}
 }
 $cipher=Get-Content -LiteralPath (Join-Path $directory.FullName 'provider.secret.json') -Raw
 if($cipher.Contains('explicit-fake-provider-wizard')){throw 'Provider key persisted in plaintext'}
 $protectedText=(Get-Content -LiteralPath (Join-Path $directory.FullName 'learner.token.dpapi') -Raw).Trim()
 $protected=ConvertTo-SecureString -String $protectedText
 if($protected.Length -ne 46){throw 'Learner credential DPAPI round trip failed'}
 $protected.Dispose()
 $notApp=Join-Path $fixtureRoot 'Setup.exe'
 [IO.File]::WriteAllText($notApp,'explicit non-executable fixture')
 $rejected=$false
 try { & ./services/assistant/connect-local-app.ps1 -ConfigurationDirectory $directory.FullName -ApplicationPath $notApp } catch { if($_.Exception.Message -like '*not Setup*'){$rejected=$true}else{throw} }
 if(-not $rejected){throw 'Installer selection was not rejected'}
 $fakeApp=Join-Path $fixtureRoot 'JECTIVE Robotics Studio.exe'
 [IO.File]::WriteAllText($fakeApp,'explicit non-executable fixture')
 $previousToken=$env:JECTIVE_ASSISTANT_TOKEN;$previousServer=$env:JECTIVE_ASSISTANT_SERVER
 try {
  $env:JECTIVE_ASSISTANT_TOKEN='outer-fake-learner-token';$env:JECTIVE_ASSISTANT_SERVER='https://outer.invalid'
  $invalidRejected=$false
  try { & ./services/assistant/connect-local-app.ps1 -ConfigurationDirectory $directory.FullName -ApplicationPath $fakeApp -ServerUrl 'http://example.invalid' } catch { if($_.Exception.Message -like '*HTTPS Railway*'){$invalidRejected=$true}else{throw} }
  if(-not $invalidRejected -or $env:JECTIVE_ASSISTANT_TOKEN -ne 'outer-fake-learner-token' -or $env:JECTIVE_ASSISTANT_SERVER -ne 'https://outer.invalid'){throw 'Endpoint rejection or environment restoration failed'}
 }finally{$env:JECTIVE_ASSISTANT_TOKEN=$previousToken;$env:JECTIVE_ASSISTANT_SERVER=$previousServer}
 $report=@{status='PASS';checkedAt=[DateTime]::UtcNow.ToString('o');scope='Actual Windows PowerShell wizard with explicit fake key; owner-only ACLs and current-user DPAPI round trip';provider='No real credentials or paid requests';publicDeployment='NOT RUN';connectApp='Metadata return, installer and insecure endpoint rejection, environment restoration checked; application launch not executed'}
 $report | ConvertTo-Json | Set-Content .verification/windows-assistant-setup.json -Encoding UTF8
 Write-Output ($report | ConvertTo-Json -Compress)
}finally{
 $env:LOCALAPPDATA=$oldData
 $resolved=[IO.Path]::GetFullPath($fixtureRoot);$temporary=[IO.Path]::GetFullPath([IO.Path]::GetTempPath())
 if(-not $resolved.StartsWith($temporary,[StringComparison]::OrdinalIgnoreCase) -or -not ([IO.Path]::GetFileName($resolved)).StartsWith('jective-setup-wizard-')){throw 'Unsafe cleanup'}
 Remove-Item -LiteralPath $resolved -Recurse -Force
}
