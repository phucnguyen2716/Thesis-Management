$ProgressPreference = 'SilentlyContinue'
try {
    $sv301 = Invoke-RestMethod -Uri "http://localhost:5145/api/drive/debug-sync?uid=SV2026301" -Method Get
    Write-Host "SV2026301 (Topic) files in DB:"
    $sv301.SvFiles | ConvertTo-Json
    
    Write-Host "`n==================================`n"
    
    $sv401 = Invoke-RestMethod -Uri "http://localhost:5145/api/drive/debug-sync?uid=SV2026401" -Method Get
    Write-Host "SV2026401 (Thesis) files in DB:"
    $sv401.SvFiles | ConvertTo-Json
} catch {
    Write-Error $_.Exception.Message
}
