# Edge Function Deployment Script
# This script deploys the updated analyze-nutrition Edge Function with JSON parsing fixes

Write-Host "🚀 Deploying analyze-nutrition Edge Function..." -ForegroundColor Cyan

# Deploy the function
supabase functions deploy analyze-nutrition

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Edge Function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Changes deployed:" -ForegroundColor Yellow
    Write-Host "  - Enhanced JSON parsing with sanitization" -ForegroundColor White
    Write-Host "  - Removal of trailing commas" -ForegroundColor White
    Write-Host "  - Comment stripping" -ForegroundColor White
    Write-Host "  - Fallback regex extraction" -ForegroundColor White
    Write-Host "  - Better error logging" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Test the function by uploading a food image in the app" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Please check your Supabase CLI configuration" -ForegroundColor Yellow
}
