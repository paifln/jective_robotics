param([Parameter(Mandatory=$true)][string]$ConfigurationDirectory,[Parameter(Mandatory=$true)][string]$ApplicationPath,[string]$ServerUrl)
$ErrorActionPreference='Stop'
$folder=(Resolve-Path -LiteralPath $ConfigurationDirectory).Path
$application=(Resolve-Path -LiteralPath $ApplicationPath).Path
if([System.IO.Path]::GetFileName($application) -ne 'JECTIVE Robotics Studio.exe'){throw 'Choose JECTIVE Robotics Studio.exe, not Setup or another executable.'}
$config=Get-Content -LiteralPath (Join-Path $folder 'runtime.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$protectedText=(Get-Content -LiteralPath (Join-Path $folder 'learner.token.dpapi') -Raw -Encoding ASCII).Trim()
$secure=ConvertTo-SecureString -String $protectedText
$pointer=[IntPtr]::Zero
$oldToken=$env:JECTIVE_ASSISTANT_TOKEN;$oldServer=$env:JECTIVE_ASSISTANT_SERVER
try {
 $pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 $env:JECTIVE_ASSISTANT_TOKEN=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
 if($ServerUrl){$endpoint=[Uri]$ServerUrl;if($endpoint.Scheme -ne 'https' -or $endpoint.UserInfo -or $endpoint.Query -or $endpoint.Fragment){throw 'Use the HTTPS Railway service address without credentials, query or fragment.'};$env:JECTIVE_ASSISTANT_SERVER=$endpoint.AbsoluteUri.TrimEnd('/')}
 else{$env:JECTIVE_ASSISTANT_SERVER='http://127.0.0.1:'+ $config.PORT}
 # The existing main instance does not receive new provisioning: close it normally first.
 Start-Process -FilePath $application -WindowStyle Normal
}finally{
 $env:JECTIVE_ASSISTANT_TOKEN=$oldToken;$env:JECTIVE_ASSISTANT_SERVER=$oldServer
 if($pointer -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}
 $secure.Dispose()
}
