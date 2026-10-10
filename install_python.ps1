
$ErrorActionPreference = "Stop"

$version = "3.13.16"
$url = "https://www.python.org/ftp/python/$version/python-$version-amd64.exe"
$installer = Join-Path $env:TEMP "python-$version-amd64.exe"
$target = Join-Path $env:LOCALAPPDATA "Programs\Python\Python313"

try {
    Write-Host "[INFO] Downloading Python $version..."

    Invoke-WebRequest -Uri $url -OutFile $installer

    Write-Host "[INFO] Verifying digital signature..."

    $signature = Get-AuthenticodeSignature -FilePath $installer

    if ($signature.Status -ne "Valid" -or
        $signature.SignerCertificate.Subject -notmatch "Python Software Foundation") {
        throw "Python installer signature verification failed."
    }

    Write-Host "[INFO] Installing Python for current user..."

    $arguments = @(
        "/quiet"
        "InstallAllUsers=0"
        "PrependPath=0"
        "Include_launcher=0"
        "Include_test=0"
        "TargetDir=$target"
    )

    $process = Start-Process `
        -FilePath $installer `
        -ArgumentList $arguments `
        -Wait `
        -PassThru

    if ($process.ExitCode -ne 0) {
        throw "Python installer exited with code $($process.ExitCode)."
    }

    $python = Join-Path $target "python.exe"

    if (-not (Test-Path $python)) {
        throw "Python executable was not found after installation."
    }

    & $python -c "import sys; assert sys.version_info[:3] == (3,13,16)"
    if ($LASTEXITCODE -ne 0) {
        throw "Installed Python version verification failed."
    }

    Write-Host "[OK] Python $version installed successfully."
    Write-Host "[OK] Executable: $python"
}
finally {
    if (Test-Path $installer) {
        Remove-Item $installer -Force
    }
}