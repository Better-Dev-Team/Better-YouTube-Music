# Setup script for Return YouTube Dislike extension
Write-Host "Setting up Return YouTube Dislike extension..." -ForegroundColor Green

$extensionsDir = "extensions"
$rydDir = "$extensionsDir\return-youtube-dislike"

# Create extensions directory if it doesn't exist
if (-not (Test-Path $extensionsDir)) {
    New-Item -ItemType Directory -Path $extensionsDir | Out-Null
}

# Check if extension already exists
if (Test-Path "$rydDir\Extensions\combined\dist\chrome") {
    Write-Host "Extension already exists at $rydDir" -ForegroundColor Yellow
    exit 0
}

Write-Host "Cloning Return YouTube Dislike repository..." -ForegroundColor Cyan
# Clone the repository
git clone https://github.com/Anarios/return-youtube-dislike.git $rydDir

if (-not (Test-Path $rydDir)) {
    Write-Host "Failed to clone repository. Please clone manually:" -ForegroundColor Red
    Write-Host "  git clone https://github.com/Anarios/return-youtube-dislike.git extensions/return-youtube-dislike" -ForegroundColor Yellow
    exit 1
}

Write-Host "Building extension..." -ForegroundColor Cyan
Set-Location $rydDir

# Install dependencies and build
npm install
npm run build

Set-Location ..\..

if (Test-Path "$rydDir\Extensions\combined\dist\chrome") {
    Write-Host "Extension built successfully!" -ForegroundColor Green
    Write-Host "Extension location: $rydDir\Extensions\combined\dist\chrome" -ForegroundColor Green
} else {
    Write-Host "Build failed. Please check the output above for errors." -ForegroundColor Red
    exit 1
}

