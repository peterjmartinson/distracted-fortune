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
    Write-Host "Category:"
    Write-Host "  1) Article Review"
    Write-Host "  2) Economics"
    Write-Host "  3) Entrepreneurship"
    Write-Host "  4) Self Improvement"
    Write-Host ""
    $CatChoice = Read-Host "Pick a number [1-4]"

    $Category = switch ($CatChoice) {
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
$DateTitle  = Get-Date -Format "yyyy-MM-dd"

if ($PostType -eq "Article") {
    $Folder = "_posts"
    $FileName = "${DateTitle}-${Kebab}.md"
    $Branch = "feature/$Kebab"
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
Write-Host "Performing git status check and pulling latest changes..." -ForegroundColor Cyan

$Status = git status --porcelain
if ($Status) {
    Write-Host "Warning: Your working directory has uncommitted changes:" -ForegroundColor Yellow
    Write-Host $Status
    $ContinueDirty = Read-Host "Do you want to continue anyway? [y/N]"
    if ($ContinueDirty -notmatch '^[Yy]$') {
        Write-Host "Aborting new post wizard." -ForegroundColor Red
        exit 1
    }
}

$DefaultBranch = (git symbolic-ref --short refs/remotes/origin/HEAD 2>$null) -replace 'origin/', ''
if (-not $DefaultBranch) { $DefaultBranch = "main" }

Write-Host "Checking out $DefaultBranch and pulling latest..." -ForegroundColor Green
git checkout $DefaultBranch
git pull

Write-Host "Creating branch: $Branch" -ForegroundColor Green
git checkout -b $Branch

# ── create files ──────────────────────────────────────────────────────────────

if ($PostType -eq "Article") {
    $DraftContent = @"
---
layout: post
title: "$FullTitle"
date: $DateFront
permalink: /$Kebab/
excerpt: "$Excerpt"
publish_post: true
tags:
$($TagsYaml.TrimEnd())
category:
  - $Category
featured_image: front_image.png
---

"@

    # Write file with LF line endings so it plays nicely with git/Jekyll
    [System.IO.File]::WriteAllText(
        (Join-Path (Get-Location) "$Folder/$FileName"),
        ($DraftContent -replace "`r`n", "`n")
    )
    # [System.IO.File]::WriteAllText(
    #     (Join-Path (Get-Location) "$Folder/images.yml"),
    #     ($ImagesContent -replace "`r`n", "`n")
    # )

    Write-Host ""
    Write-Host "Created: $Folder/$FileName"
    # Write-Host "Created: $Folder/images.yml"
    Write-Host ""
} else {
    # Newsletter: minimal front matter — no excerpt, tags, featured_image, or images.yml
    $DraftContent = @"
---
title: "$FullTitle"
date: $DateFront
email_subject: "$EmailSubject"
publish_post: true
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

$TargetFilePath = if ($PostType -eq "Article") { "$Folder/$FileName" } else { "$Folder/draft.md" }
vim "$TargetFilePath"
