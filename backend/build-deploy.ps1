# build-deploy.ps1
# This script creates a deployment-ready zip file for AWS Elastic Beanstalk
# It excludes node_modules, .env, and other unnecessary files

$ErrorActionPreference = "Stop"

# Use current script directory or specify manually if needed
$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = Get-Location }
$zipPath = Join-Path $rootPath "deploy.zip"

if (Test-Path $zipPath) {
    Write-Host "🗑️ Removing old zip: $zipPath"
    Remove-Item $zipPath -Force
}

Set-Location $rootPath

Write-Host "🗜️ Zipping files for Elastic Beanstalk deployment using tar..."

# Create exclusion file for tar (using standard tar exclude syntax)
$excludeFile = ".deploy-ignore"
@("node_modules", ".env", ".git", ".serverless", "*.zip", "npm-debug.log", ".DS_Store", "build-*.ps1", ".deploy-ignore") | Out-File -FilePath $excludeFile -Encoding utf8

# Use tar to create the zip file (much faster than Compress-Archive)
# -a: auto-detect format by extension
# -c: create
# -f: filename
# -X: exclude items listed in file
tar -a -c -f "deploy.zip" --exclude-from=$excludeFile .

# Cleanup exclusion file
Remove-Item $excludeFile -Force

Write-Host "✅ Created deployment zip at: $zipPath"
Write-Host "🚀 Upload this ZIP file to AWS Elastic Beanstalk."


