# ── helpers ──────────────────────────────────────────────────────────────────

function To-Pascal($str) {
    ($str -split '\s+' | ForEach-Object {
        $_.Substring(0,1).ToUpper() + $_.Substring(1)
    }) -join ''
}

function To-Kebab($str) {
    ($str.ToLower() -split '\s+') -join '-'
}

# ── interview ─────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "=== New post wizard ===" -ForegroundColor Cyan
Write-Host ""

$FullTitle      = Read-Host "Full article title"
$ShortTitleRaw  = Read-Host "Short title (used for folder + branch, e.g. 'Burn The Ships')"
$Excerpt        = Read-Host "Excerpt (one-line summary)"
$TagsRaw        = Read-Host "Tags (comma-separated, e.g. adhd, focus, productivity)"

Write-Host ""
Write-Host "Second category (Article is always included):"
Write-Host "  1) Article Review"
Write-Host "  2) Economics"
Write-Host "  3) Entrepreneurship"
Write-Host "  4) Self Improvement"
Write-Host ""
$CatChoice = Read-Host "Pick a number [1-4]"

$SecondCat = switch ($CatChoice) {
    "1" { "Article Review" }
    "2" { "Economics" }
    "3" { "Entrepreneurship" }
    "4" { "Self Improvement" }
    default {
        Write-Host "Invalid choice, defaulting to Entrepreneurship" -ForegroundColor Yellow
        "Entrepreneurship"
    }
}

# ── derive names ──────────────────────────────────────────────────────────────

$Pascal      = To-Pascal $ShortTitleRaw
$Kebab       = To-Kebab  $ShortTitleRaw
$DateFolder  = Get-Date -Format "yyyyMMdd"
$DateFront   = Get-Date -Format "yyyy-MM-ddT13:00:00-05:00"

$Folder = "content/posts/${DateFolder}_${Pascal}"
$Branch = "feature/$Kebab"

# ── tags yaml lines ───────────────────────────────────────────────────────────

$TagsYaml = ($TagsRaw -split ',') | ForEach-Object {
    "  - $($_.Trim())"
} | Out-String

# ── git branch ────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Creating branch: $Branch" -ForegroundColor Green
git checkout -b $Branch

# ── create files ──────────────────────────────────────────────────────────────

New-Item -ItemType Directory -Path $Folder -Force | Out-Null

$DraftContent = @"
---
title: "$FullTitle"
date: $DateFront
excerpt: "$Excerpt"
tags:
$($TagsYaml.TrimEnd())
categories:
  - Article
  - $SecondCat
featured_image: front_image.png
---

"@

$ImagesContent = @"
images:
  - file: front_image.png
    caption: "A short caption describing what is shown in the image."
    alt: "A brief description of the image for screen readers."
    credit: "Photographer or source name"
"@

# Write files with LF line endings so they play nicely with git/markdown
[System.IO.File]::WriteAllText(
    (Join-Path (Get-Location) "$Folder/draft.md"),
    ($DraftContent -replace "`r`n", "`n")
)
[System.IO.File]::WriteAllText(
    (Join-Path (Get-Location) "$Folder/images.yml"),
    ($ImagesContent -replace "`r`n", "`n")
)

Write-Host ""
Write-Host "Created: $Folder/draft.md"
Write-Host "Created: $Folder/images.yml"
Write-Host ""

# ── open vim ─────────────────────────────────────────────────────────────────

vim "$Folder/draft.md"
