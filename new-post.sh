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

read -rp "Full article title: " FULL_TITLE

read -rp "Short title (used for folder + branch, e.g. 'Burn The Ships'): " SHORT_TITLE_RAW

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

# ── derive names ──────────────────────────────────────────────────────────────

PASCAL=$(to_pascal "$SHORT_TITLE_RAW")
KEBAB=$(to_kebab "$SHORT_TITLE_RAW")
DATE_FOLDER=$(date +%Y%m%d)
DATE_FRONT=$(date +%Y-%m-%dT13:00:00-05:00)

FOLDER="content/posts/${DATE_FOLDER}_${PASCAL}"
BRANCH="feature/${KEBAB}"

# ── tags yaml lines ───────────────────────────────────────────────────────────

TAGS_YAML=""
IFS=',' read -ra TAG_ARR <<< "$TAGS_RAW"
for tag in "${TAG_ARR[@]}"; do
  tag=$(echo "$tag" | sed 's/^ *//;s/ *$//')
  TAGS_YAML="${TAGS_YAML}  - ${tag}"$'\n'
done

# ── git branch ────────────────────────────────────────────────────────────────

echo ""
echo "Creating branch: $BRANCH"
git checkout -b "$BRANCH"

# ── create files ──────────────────────────────────────────────────────────────

mkdir -p "$FOLDER"

cat > "${FOLDER}/draft.md" <<EOF
---
title: "${FULL_TITLE}"
date: ${DATE_FRONT}
excerpt: "${EXCERPT}"
tags:
${TAGS_YAML}categories:
  - Article
  - ${SECOND_CAT}
featured_image: front_image.png
---

EOF

cat > "${FOLDER}/images.yml" <<EOF
images:
  - file: front_image.png
    caption: "A short caption describing what is shown in the image."
    alt: "A brief description of the image for screen readers."
    credit: "Photographer or source name"
EOF

echo ""
echo "Created: $FOLDER/draft.md"
echo "Created: $FOLDER/images.yml"
echo ""

# ── open vim ─────────────────────────────────────────────────────────────────

vim "${FOLDER}/draft.md"
