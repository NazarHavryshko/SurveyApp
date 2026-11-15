@echo off & set "BAT_FILE=%~f0" & powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = [System.IO.File]::ReadAllText($env:BAT_FILE); $m = '###PS' + '###'; $i = $c.IndexOf($m); Invoke-Expression $c.Substring($i + $m.Length)" & pause & exit /b
###PS###
$root = (Split-Path -Parent $env:BAT_FILE).TrimEnd('\')
$outFile = Join-Path $root 'full_project_code.txt'
$excludeDirs = @('node_modules', 'bin', 'obj', '.git', '.vs', '.idea', 'dist', 'build', '.vite', 'packages')
$includeExts = @('.cs', '.ts', '.tsx', '.js', '.jsx', '.sql', '.json', '.yml', '.yaml', '.html', '.css', '.csproj', '.sln', '.md')
$excludeFiles = @('package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'full_project_code.txt', (Split-Path -Leaf $env:BAT_FILE))

$files = @(Get-ChildItem -Path $root -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $parts = $rel.Split('\')
    $skip = $false
    foreach ($p in $parts) {
        if ($excludeDirs -contains $p) {
            $skip = $true
            break
        }
    }
    -not $skip -and
    ($includeExts -contains $_.Extension.ToLower() -or $_.Name -eq 'Dockerfile') -and
    ($excludeFiles -notcontains $_.Name) -and
    (-not $_.Name.EndsWith('.Designer.cs'))
})

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine('=== PROJECT STRUCTURE ===')
foreach ($f in $files) {
    [void]$sb.AppendLine($f.FullName.Substring($root.Length + 1))
}
[void]$sb.AppendLine('')

foreach ($f in $files) {
    $rel = $f.FullName.Substring($root.Length + 1)
    [void]$sb.AppendLine('================================================================================')
    [void]$sb.AppendLine("FILE: $rel")
    [void]$sb.AppendLine('================================================================================')
    try {
        $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
        [void]$sb.AppendLine($content)
    } catch {
        [void]$sb.AppendLine("[Error reading file: $($_.Exception.Message)]")
    }
    [void]$sb.AppendLine('')
}

[System.IO.File]::WriteAllText($outFile, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))
Write-Host "Done! Collected files: $($files.Count). Saved to: $outFile" -ForegroundColor Green