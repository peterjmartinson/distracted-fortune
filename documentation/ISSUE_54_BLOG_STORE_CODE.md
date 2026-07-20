Summary
-------

Implement the Math Mugs storefront, data architecture, and UI components on https://distractedfortune.com.

Motivation
----------

- Showcase Math Mugs directly on the blog domain (`distractedfortune.com/mugs/`) with high-resolution photos, custom math proof taglines, and direct checkout links to the Printful Quick Store (`distractedfortune.printful.me`).
- Provide post-footer callout banners encouraging readers of math/tech posts to check out Math Mugs.
- Maintain catalog definitions statically in `_data/mugs.yml` for zero build complexity, maximum reliability, and full control over mathematical taglines and descriptions.

Architecture Decision (Static YAML vs. API Sync)
-----------------------------------------------

- **Decision**: Maintained `_data/mugs.yml` directly in the repository rather than calling external Printful REST APIs via GitHub Actions.
- **Rationale**: Printful Quick Store (`distractedfortune.printful.me`) manages checkout, payment processing, manufacturing, and shipping. Static YAML catalog definition guarantees fast Jekyll builds, zero external API point-of-failure risks, and allows rich custom proof taglines for each mug.

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

### 3) Navigation Header Link (`_includes/header.html` & `_config.yml`)
- Add **Mugs** to top navigation links for site discoverability.

### 4) Post Footer Promo Banner (`_includes/mug_promo.html`)
- Create a subtle callout snippet: *"Enjoyed this post? Check out our Math Mugs!"*
- Include this snippet in `_layouts/post.html` above subscription/comment blocks.

Files Created / Modified
------------------------

- [x] [NEW] `mugs.md` — Store showcase page
- [x] [NEW] `_layouts/store.html` — Layout template for store grid
- [x] [NEW] `_data/mugs.yml` — Data store for Math Mugs catalog
- [x] [NEW] `_includes/mug_promo.html` — Post footer banner template
- [x] [NEW] `_includes/header.html` — Top navigation header override with Mugs link
- [x] [MODIFY] `_layouts/post.html` — Include mug promo banner
- [x] [MODIFY] `_config.yml` — Add store configuration settings

Verification Checklist
----------------------

- [x] Create `_data/mugs.yml` schema with initial product definitions.
- [x] Create `_layouts/store.html` and `mugs.md` page layout.
- [x] Add navigation header link for `/mugs/`.
- [x] Add `_includes/mug_promo.html` and integrate into `_layouts/post.html`.
- [x] Verify Jekyll site build locally and visual rendering.
