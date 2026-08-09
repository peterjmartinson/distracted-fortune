#!/usr/bin/env bash
set -e

# ── helpers ──────────────────────────────────────────────────────────────────

to_pascal() {
  # "my short title" → "MyShortTitle"
  echo "$1" | sed 's/  */ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2); print}' | tr -d ' '
}

to_kebab() {
  # "My Short Title" → "my-short-title"
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/  */ /g' | tr ' ' '-'
}

# ── interview ─────────────────────────────────────────────────────────────────

echo ""
echo "=== New post wizard ==="
echo ""

# Post type selection — determines output path, front matter shape, and branch prefix
echo "Post type:"
echo "  1) Article"
echo "  2) Newsletter"
echo ""
read -rp "Pick a number [1-2]: " TYPE_CHOICE

case "$TYPE_CHOICE" in
  1) POST_TYPE="Article" ;;
  2) POST_TYPE="Newsletter" ;;
  *) echo "Invalid choice, defaulting to Article"; POST_TYPE="Article" ;;
esac

echo ""

# Shared fields (both post types)
read -rp "Full title: " FULL_TITLE
read -rp "Short title (used for folder + branch, e.g. 'Burn The Ships'): " SHORT_TITLE_RAW

if [ "$POST_TYPE" = "Article" ]; then
  # Article-only fields
  read -rp "Excerpt (one-line summary): " EXCERPT
  read -rp "Tags (comma-separated, e.g. adhd, focus, productivity): " TAGS_RAW

  echo ""
  echo "Second category (Article is always included):"
  echo "  1) Article Review"
  echo "  2) Economics"
  echo "  3) Entrepreneurship"
  echo "  4) Self Improvement"
  echo ""
  read -rp "Pick a number [1-4]: " CAT_CHOICE

  case "$CAT_CHOICE" in
    1) SECOND_CAT="Article Review" ;;
    2) SECOND_CAT="Economics" ;;
    3) SECOND_CAT="Entrepreneurship" ;;
    4) SECOND_CAT="Self Improvement" ;;
    *) echo "Invalid choice, defaulting to Entrepreneurship"; SECOND_CAT="Entrepreneurship" ;;
  esac
fi

# ── derive names ──────────────────────────────────────────────────────────────

PASCAL=$(to_pascal "$SHORT_TITLE_RAW")
KEBAB=$(to_kebab "$SHORT_TITLE_RAW")
DATE_FOLDER=$(date +%Y%m%d)
DATE_FRONT=$(date +%Y-%m-%dT13:00:00-05:00)
DATE_TITLE=$(date +%Y-%m-%d)

if [ "$POST_TYPE" = "Article" ]; then
  FOLDER="_posts"
  FILE_NAME="${DATE_TITLE}-${KEBAB}.md"
  BRANCH="feature/${KEBAB}"
else
  # Newsletter: separate content lane
  FOLDER="content/newsletters/${DATE_FOLDER}_${PASCAL}"
  FILE_NAME="draft.md"
  BRANCH="newsletter/${KEBAB}"
  EMAIL_SUBJECT="[Distracted Fortune] Raw Thoughts On ${SHORT_TITLE_RAW}"
fi

# ── tags yaml lines (Article only) ──────────────────────────────────────────

if [ "$POST_TYPE" = "Article" ]; then
  TAGS_YAML=""
  IFS=',' read -ra TAG_ARR <<< "$TAGS_RAW"
  for tag in "${TAG_ARR[@]}"; do
    tag=$(echo "$tag" | sed 's/^ *//;s/ *$//')
    TAGS_YAML="${TAGS_YAML}  - ${tag}"$'\n'
  done
fi

# ── git branch ────────────────────────────────────────────────────────────────

echo ""
echo "Performing git status check and pulling latest changes..."

if [ -n "$(git status --porcelain)" ]; then
  echo "Warning: Your working directory has uncommitted changes:"
  git status --porcelain
  read -rp "Do you want to continue anyway? [y/N]: " CONTINUE_DIRTY
  if [[ ! "$CONTINUE_DIRTY" =~ ^[Yy]$ ]]; then
    echo "Aborting new post wizard."
    exit 1
  fi
fi

DEFAULT_BRANCH=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@origin/@@' || echo "main")
echo "Checking out $DEFAULT_BRANCH and pulling latest..."
git checkout "$DEFAULT_BRANCH"
git pull

echo ""
echo "Creating branch: $BRANCH"
git checkout -b "$BRANCH"

# ── create files ──────────────────────────────────────────────────────────────

mkdir -p "$FOLDER"

if [ "$POST_TYPE" = "Article" ]; then
  cat > "${FOLDER}/${FILE_NAME}" <<EOF
---
layout: post
title: "${FULL_TITLE}"
date: ${DATE_FRONT}
permalink: /${KEBAB}/
excerpt: "${EXCERPT}"
publish_post: true
tags:
${TAGS_YAML}category:
  - ${SECOND_CAT}
featured_image: front_image.png
---

EOF

  echo ""
  echo "Created: $FOLDER/$FILE_NAME"
  echo ""
else
  # Newsletter: minimal front matter
  cat > "${FOLDER}/${FILE_NAME}" <<EOF
---
title: "${FULL_TITLE}"
date: ${DATE_FRONT}
email_subject: "${EMAIL_SUBJECT}"
publish_post: true
categories:
  - Newsletter
---

Dear Reader,

EOF

  echo ""
  echo "Created: $FOLDER/$FILE_NAME"
  echo ""
fi

# ── open vim ─────────────────────────────────────────────────────────────────

vim "${FOLDER}/${FILE_NAME}"
