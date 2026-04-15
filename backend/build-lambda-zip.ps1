# build-lambda-zip.ps1
# This script creates a deployment-ready zip file for AWS Lambda.

$ErrorActionPreference = "Stop"

# Use script's root folder
$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = Get-Location }
Set-Location $rootPath

$zipName = "lambda-deploy.zip"
$zipPath = Join-Path $rootPath $zipName

# Setup cleanup function
function CleanupDevModules {
    Write-Host "Restoring development dependencies..."
    if (Test-Path "node_modules") {
        Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path "node_modules_dev_backup") {
        Rename-Item "node_modules_dev_backup" "node_modules" -Force
    }
}

# 1. Cleanup old files
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path "node_modules_dev_backup") { Remove-Item "node_modules_dev_backup" -Recurse -Force -ErrorAction SilentlyContinue }

# 2. Swap modules
if (Test-Path "node_modules") {
    Write-Host "Backing up development node_modules..."
    Rename-Item "node_modules" "node_modules_dev_backup" -Force
}

# 3. Install production deps
Write-Host "Installing production dependencies..."
npm install --omit=dev --no-audit --no-fund

# 4. Create exclusion list and Zip
Write-Host "Zipping for Lambda using tar..."
$excludeFile = ".lambda-zip-ignore"
@("node_modules_dev_backup", ".env", ".git", ".serverless", "*.zip", "npm-debug.log", ".DS_Store", "build-*.ps1", ".lambda-zip-ignore") | Out-File -FilePath $excludeFile -Encoding utf8

tar -a -c -f $zipName --exclude-from=$excludeFile .

# 5. Restore modules
CleanupDevModules
if (Test-Path $excludeFile) { Remove-Item $excludeFile -Force }

Write-Host "Created: $zipPath"
Write-Host "Upload this to AWS Lambda (Handler: index.handler)"
