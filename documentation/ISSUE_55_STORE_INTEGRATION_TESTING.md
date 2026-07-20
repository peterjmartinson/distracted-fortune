Summary
-------

Define end-to-end verification, automated workflow testing, user journey validation, and launch checks for the Math Mugs store integration on https://distractedfortune.com.

Motivation
----------

- Ensure all user touchpoints (header navigation, `/mugs/` page, post promo banners, Printful checkout links) work seamlessly on desktop and mobile browsers.
- Validate that the Printful API sync script and GitHub Action execute reliably without breaking Jekyll build steps or data formatting.
- Confirm zero friction for site visitors transitioning from blog reading to purchasing mugs on Printful.

Integration & Testing Plan
--------------------------

### 1) GitHub Secret & Environment Setup
1. In GitHub Repository Settings → **Secrets and variables** → **Actions**.
2. Add repository secret: `PRINTFUL_API_KEY`.
3. Verify permissions for GitHub Actions to write/commit updated `_data/mugs.yml`.

### 2) Local Sync Script & Jekyll Build Testing
1. **Mock / Dry-Run Test**:
   - Run `node scripts/sync_printful_mugs.js --dry-run` or with test environment variables.
   - Verify `_data/mugs.yml` is parsed correctly and output valid YAML syntax.
2. **Jekyll Local Build**:
   - Test build locally (e.g. Jekyll serve / build).
   - Ensure `/mugs/` route generates properly with product cards, images, prices, and links.

### 3) End-to-End User Journey Testing (Manual Walkthrough)
1. **Homepage / Blog Post Navigation**:
   - Open blog homepage and click **Mugs** in header navigation → confirms redirection to `/mugs/`.
   - Open a blog post (e.g., `2026-03-23-ai-fire.md`) → scroll to bottom to verify promo banner displays properly.
2. **Product Selection & Redirect**:
   - On `/mugs/`, click **"Buy on Printful"** button on a Math Mug card.
   - Confirm target opens in a new tab pointing to the exact Printful Quick Store product page.
3. **Printful Checkout Flow**:
   - Verify product title, mockup image, price, and shipping calculation on Printful page.
   - Add item to cart and proceed to Stripe checkout screen (cancel before finalizing unless performing real test order).

### 4) Mobile & Responsive UI Verification
- Verify layout responsiveness on small screens (mobile portrait/landscape, tablet):
  - Store card grid wraps cleanly into a single column.
  - CTA buttons and images scale gracefully.
  - Header nav link is visible in mobile hamburger menu.

### 5) GitHub Actions Workflow Verification
1. Trigger `.github/workflows/printful_sync.yml` manually via GitHub Actions **Run workflow** button.
2. Inspect step execution logs for:
   - Successful Printful API request.
   - `_data/mugs.yml` update generation.
   - Git diff detection and commit step.
3. Confirm workflow completes with green checkmark.

Verification Checklist
----------------------

- [ ] `PRINTFUL_API_KEY` configured in GitHub Repository Secrets.
- [ ] `node scripts/sync_printful_mugs.js` executes without error.
- [ ] Jekyll site builds cleanly locally and on GitHub Pages.
- [ ] `/mugs/` page renders product cards correctly.
- [ ] Header navigation includes **Mugs** link.
- [ ] Post footer promo banner appears on articles.
- [ ] All "Buy on Printful" links resolve to correct Printful Quick Store items.
- [ ] Responsive layout verified across mobile, tablet, and desktop views.
- [ ] Automated `.github/workflows/printful_sync.yml` runs successfully.
