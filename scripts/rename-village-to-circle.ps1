$srcDir = "C:\Users\pooji\.gemini\antigravity-ide\scratch\ecoshare"

# index.html
$htmlPath = "$srcDir\index.html"
$htmlContent = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
$htmlUpdated = $htmlContent -replace "EcoVillage", "EcoCircle" -replace "ecovillage", "ecocircle"
[System.IO.File]::WriteAllText($htmlPath, $htmlUpdated, [System.Text.Encoding]::UTF8)
Write-Host "Updated HTML: index.html"

Write-Host "Done!"
