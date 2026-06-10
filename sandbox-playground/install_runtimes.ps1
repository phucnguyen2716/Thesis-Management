# Ensure TLS 1.2 is used for web requests
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Create target directories
$localAppData = $env:LOCALAPPDATA
$dotnetDir = Join-Path $localAppData "Microsoft\dotnet"
$nodeParentDir = Join-Path $localAppData "nodejs"

Write-Output "=== Start Installing Runtimes ==="

# 1. Install .NET 8 SDK
Write-Output "1. Installing .NET 8.0 SDK..."
if (-not (Test-Path $dotnetDir)) {
    New-Item -ItemType Directory -Force -Path $dotnetDir | Out-Null
}
$dotnetInstallScript = Join-Path $env:TEMP "dotnet-install.ps1"
Write-Output "Downloading dotnet-install.ps1..."
Invoke-WebRequest -Uri "https://dot.net/v1/dotnet-install.ps1" -OutFile $dotnetInstallScript
Write-Output "Running dotnet-install.ps1..."
& $dotnetInstallScript -Channel 8.0 -InstallDir $dotnetDir
Write-Output ".NET SDK installation completed."

# 2. Install Node.js
Write-Output "2. Installing Node.js v22.11.0..."
if (-not (Test-Path $nodeParentDir)) {
    New-Item -ItemType Directory -Force -Path $nodeParentDir | Out-Null
}
$nodeZipUrl = "https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip"
$nodeZipPath = Join-Path $env:TEMP "node-v22.11.0-win-x64.zip"
Write-Output "Downloading Node.js zip from $nodeZipUrl..."
Invoke-WebRequest -Uri $nodeZipUrl -OutFile $nodeZipPath
Write-Output "Extracting Node.js zip..."
Expand-Archive -Path $nodeZipPath -DestinationPath $nodeParentDir -Force
Write-Output "Node.js extracted successfully."

# 3. Update PATH
Write-Output "3. Updating User Environment PATH..."
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$paths = $userPath -split ';' | Where-Object { $_ -ne "" }
$pathsToAdd = @(
    "C:\Program Files\Git\cmd",
    $dotnetDir,
    (Join-Path $nodeParentDir "node-v22.11.0-win-x64")
)
$addedAny = $false
foreach ($p in $pathsToAdd) {
    # Normalize paths to check if already in PATH
    $normalizedP = $p.Replace("/", "\").TrimEnd("\")
    $exists = $false
    foreach ($existingP in $paths) {
        if ($existingP.Replace("/", "\").TrimEnd("\") -eq $normalizedP) {
            $exists = $true
            break
        }
    }
    if (-not $exists) {
        $paths += $normalizedP
        $addedAny = $true
        Write-Output "Adding to PATH: $normalizedP"
    }
}

if ($addedAny) {
    $newPath = $paths -join ';'
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Output "PATH updated successfully in User Environment."
} else {
    Write-Output "All paths are already in PATH."
}

Write-Output "=== Installation Complete ==="
