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

# Post type selection — determines output path, front matter shape, and branch prefix
Write-Host "Post type:"
Write-Host "  1) Article"
Write-Host "  2) Newsletter"
Write-Host ""
$TypeChoice = Read-Host "Pick a number [1-2]"

$PostType = switch ($TypeChoice) {
    "1" { "Article" }
    "2" { "Newsletter" }
    default {
        Write-Host "Invalid choice, defaulting to Article" -ForegroundColor Yellow
        "Article"
    }
}

Write-Host ""

# Shared fields (both post types)
$FullTitle     = Read-Host "Full title"
$ShortTitleRaw = Read-Host "Short title (used for folder + branch, e.g. 'Burn The Ships')"

if ($PostType -eq "Article") {
    # Article-only fields
    $Excerpt = Read-Host "Excerpt (one-line summary)"
    $TagsRaw = Read-Host "Tags (comma-separated, e.g. adhd, focus, productivity)"

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
}

# ── derive names ──────────────────────────────────────────────────────────────

$Pascal     = To-Pascal $ShortTitleRaw
$Kebab      = To-Kebab  $ShortTitleRaw
$DateFile   = Get-Date -Format "yyyy-MM-dd"
$DateFolder = Get-Date -Format "yyyyMMdd"
$DateFront  = Get-Date -Format "yyyy-MM-ddT13:00:00-05:00"

if ($PostType -eq "Article") {
    $PostFile = "_posts/$DateFile-$Kebab.md"
    $Branch   = "feature/$Kebab"
} else {
    # Newsletter: separate content lane
    $Folder       = "content/newsletters/${DateFolder}_${Pascal}"
    $Branch       = "newsletter/$Kebab"
    $EmailSubject = "[Distracted Fortune] $ShortTitleRaw"
}

# ── tags yaml lines (Article only) ──────────────────────────────────────────

if ($PostType -eq "Article") {
    $TagsYaml = ($TagsRaw -split ',') | ForEach-Object {
        "  - $($_.Trim())"
    } | Out-String
}

# ── git branch ────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Creating branch: $Branch" -ForegroundColor Green
git checkout -b $Branch

# ── create files ──────────────────────────────────────────────────────────────

if ($PostType -eq "Article") {
    $DraftContent = @"
---
layout: post
title: "$FullTitle"
date: $DateFile
permalink: /$Kebab/
excerpt: "$Excerpt"
tags:
$($TagsYaml.TrimEnd())
categories:
  - Article
  - $SecondCat
featured_image: ""
---

"@

    # Write file with LF line endings so it plays nicely with git/Jekyll
    [System.IO.File]::WriteAllText(
        (Join-Path (Get-Location) $PostFile),
        ($DraftContent -replace "`r`n", "`n")
    )

    Write-Host ""
    Write-Host "Created: $PostFile"
    Write-Host ""
} else {
    # Newsletter: minimal front matter — no excerpt, tags, featured_image, or images.yml
    $DraftContent = @"
---
title: "$FullTitle"
date: $DateFront
email_subject: "$EmailSubject"
categories:
  - Newsletter
---

Dear Reader,


"@

    New-Item -ItemType Directory -Path $Folder -Force | Out-Null

    # Write file with LF line endings
    [System.IO.File]::WriteAllText(
        (Join-Path (Get-Location) "$Folder/draft.md"),
        ($DraftContent -replace "`r`n", "`n")
    )

    Write-Host ""
    Write-Host "Created: $Folder/draft.md"
    Write-Host ""
}

# ── open vim ─────────────────────────────────────────────────────────────────

if ($PostType -eq "Article") {
    vim $PostFile
} else {
    vim "$Folder/draft.md"
}
