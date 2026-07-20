Summary
-------

Implement the Math Mugs storefront, data architecture, UI components, and automated Printful API sync pipeline on https://distractedfortune.com.

Motivation
----------

- Showcase Math Mugs directly on the blog domain (`distractedfortune.com/mugs/`) with high-resolution photos, math proof taglines, and direct checkout links to Printful Quick Store.
- Provide post-footer callout banners encouraging readers of math/tech posts to check out Math Mugs.
- Automate catalog synchronization via Printful REST API so new mugs published on Printful automatically sync to `_data/mugs.yml` via GitHub Actions without manual site edits.

Proposed Implementation
-----------------------

### 1) Data Architecture (`_data/mugs.yml`)
Store product data cleanly in YAML format:

```yaml
- id: 101
  title: "Euler's Identity Mug"
  tagline: "The most beautiful equation in mathematics: e^(i*pi) + 1 = 0"
  price: "$18.00"
  image: "/assets/post-images/mugs/eulers-identity.jpg"
  url: "https://distractedfortune.printful.me/product/eulers-identity"
  featured: true
  active: true
```

### 2) Dedicated Store Showcase Page (`mugs.md` & `_layouts/store.html`)
- Create `mugs.md` with `permalink: /mugs/` and `layout: store`.
- Render a responsive grid of cards sourced from `site.data.mugs`.
- Each card displays mug image, title, math tagline, price badge, and a **"Buy on Printful"** CTA button opening the Quick Store link in a new tab.

### 3) Navigation Header Link (`_includes/header.html` or `_config.yml`)
- Add **Mugs** or **Store** to top navigation links for seamless site discoverability.

### 4) Post Footer Promo Banner (`_includes/mug_promo.html`)
- Create a subtle callout snippet: *"Enjoyed this post? Check out our Math Mugs!"*
- Include this snippet in `_layouts/post.html` above or alongside subscription/comment blocks.

### 5) Printful API Sync Script (`scripts/sync_printful_mugs.js`)
- Similar to `scripts/fetch_discussion_counts.js`, write a Node.js script using `fetch` or standard libraries.
- Connect to Printful REST API (`https://api.printful.com/store/products`) using `PRINTFUL_API_KEY`.
- Fetch active store products, extract titles, mockups, prices, and URLs.
- Update `_data/mugs.yml` with fresh data while preserving custom taglines or manual overrides.

### 6) Automated GitHub Action Workflow (`.github/workflows/printful_sync.yml`)
- Schedule workflow (e.g., weekly or on manual dispatch).
- Run `scripts/sync_printful_mugs.js` with secret `PRINTFUL_API_KEY`.
- Automatically commit updated `_data/mugs.yml` back to repository if changes are detected.

Files Created / Modified
------------------------

- [NEW] `mugs.md` — Store showcase page
- [NEW] `_layouts/store.html` — Layout template for store grid
- [NEW] `_data/mugs.yml` — Data store for Math Mugs catalog
- [NEW] `_includes/mug_promo.html` — Post footer banner template
- [NEW] `scripts/sync_printful_mugs.js` — Printful API sync script
- [NEW] `.github/workflows/printful_sync.yml` — GitHub Action automation workflow
- [MODIFY] `_includes/header.html` — Add Mugs menu link
- [MODIFY] `_layouts/post.html` — Include mug promo banner
- [MODIFY] `_config.yml` — Add store configuration settings

Implementation Checklist
------------------------

- [ ] Create `_data/mugs.yml` schema with initial product definitions.
- [ ] Create `_layouts/store.html` and `mugs.md` page layout.
- [ ] Add navigation header link for `/mugs/`.
- [ ] Add `_includes/mug_promo.html` and integrate into `_layouts/post.html`.
- [ ] Develop `scripts/sync_printful_mugs.js` to query Printful API.
- [ ] Configure `.github/workflows/printful_sync.yml` with `PRINTFUL_API_KEY` secret support.
- [ ] Verify local build with `bundle exec jekyll serve` or Node script test.
