# Deploy Edge Function Script for CalorieWise
# This script deploys the analyze-nutrition Edge Function to Supabase

Write-Host "`n🚀 CalorieWise Edge Function Deployment" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Check if Supabase CLI is installed
Write-Host "📦 Checking Supabase CLI..." -ForegroundColor Yellow
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Running: npm install -g supabase`n" -ForegroundColor Cyan
    npm install -g supabase
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Supabase CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Supabase CLI installed successfully`n" -ForegroundColor Green
} else {
    $version = supabase --version
    Write-Host "✅ Supabase CLI found: $version`n" -ForegroundColor Green
}

# Navigate to project directory
$projectPath = "c:\anti\calorie-wise"
Write-Host "📁 Navigating to project: $projectPath" -ForegroundColor Yellow

if (!(Test-Path $projectPath)) {
    Write-Host "❌ Project directory not found: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "✅ Current directory: $(Get-Location)`n" -ForegroundColor Green

# Check if function file exists
$functionPath = "supabase\functions\analyze-nutrition\index.ts"
Write-Host "📄 Checking function file: $functionPath" -ForegroundColor Yellow

if (!(Test-Path $functionPath)) {
    Write-Host "❌ Function file not found: $functionPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Function file found`n" -ForegroundColor Green

# Check login status
Write-Host "🔐 Checking Supabase login status..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in. Please login to Supabase..." -ForegroundColor Yellow
    Write-Host "This will open a browser window for authentication.`n" -ForegroundColor Cyan
    supabase login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Logged in to Supabase`n" -ForegroundColor Green

# Link project
Write-Host "🔗 Linking project..." -ForegroundColor Yellow
Write-Host "Project Reference: rsjdfnracserzrxrlyzw`n" -ForegroundColor Cyan

$linkOutput = supabase link --project-ref rsjdfnracserzrxrlyzw 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Project linked successfully`n" -ForegroundColor Green
} else {
    # Check if already linked
    if ($linkOutput -like "*already linked*") {
        Write-Host "✅ Project already linked`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to link project" -ForegroundColor Red
        Write-Host $linkOutput -ForegroundColor Red
        exit 1
    }
}

# Deploy function
Write-Host "📦 Deploying analyze-nutrition function..." -ForegroundColor Yellow
Write-Host "This may take a minute...`n" -ForegroundColor Cyan

supabase functions deploy analyze-nutrition

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Function deployment failed" -ForegroundColor Red
    Write-Host "Check the error messages above for details.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Function deployed successfully!`n" -ForegroundColor Green

# Verify deployment
Write-Host "✅ Verifying deployment..." -ForegroundColor Yellow
Write-Host "`nAvailable functions:" -ForegroundColor Cyan
supabase functions list

# Success message
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test your app at: http://localhost:5173/analyze" -ForegroundColor Cyan
Write-Host "2. Take a photo of food" -ForegroundColor Cyan
Write-Host "3. Click 'Analyze Nutrition Now'" -ForegroundColor Cyan
Write-Host "4. Monitor logs: supabase functions logs analyze-nutrition --tail`n" -ForegroundColor Cyan

Write-Host "Function URL:" -ForegroundColor Yellow
Write-Host "https://rsjdfnracserzrxrlyzw.supabase.co/functions/v1/analyze-nutrition`n" -ForegroundColor Cyan

Write-Host "✅ All done! Your meal scanning feature is now live!`n" -ForegroundColor Green
