Summary
-------

Define end-to-end verification, user journey validation, and launch checks for the Math Mugs store integration on https://distractedfortune.com.

Motivation
----------

- Ensure all user touchpoints (header navigation, `/mugs/` page, post promo banners, Printful checkout links) work seamlessly on desktop and mobile browsers.
- Confirm zero friction for site visitors transitioning from blog reading to purchasing mugs on Printful Quick Store (`distractedfortune.printful.me`).

Integration & Testing Plan
--------------------------

### 1) Jekyll Local & Production Build Testing
1. **Jekyll Build**:
   - Verify site builds cleanly without template errors.
   - Ensure `/mugs/` route generates properly with product cards, images, prices, and links.

### 2) End-to-End User Journey Testing (Manual Walkthrough)
1. **Homepage / Blog Post Navigation**:
   - Open blog homepage and click **Mugs** in header navigation → confirms redirection to `/mugs/`.
   - Open a blog post → scroll to bottom to verify promo banner displays properly.
2. **Product Selection & Redirect**:
   - On `/mugs/`, click **"Buy on Printful"** button on a Math Mug card.
   - Confirm target opens in a new tab pointing to the exact Printful Quick Store product page.
3. **Printful Checkout Flow**:
   - Verify product title, mockup image, price, and shipping calculation on Printful page.
   - Proceed to Stripe checkout screen.

### 3) Mobile & Responsive UI Verification
- Verify layout responsiveness on small screens (mobile portrait/landscape, tablet):
  - Store card grid wraps cleanly into a single column.
  - CTA buttons and images scale gracefully.
  - Header nav link is visible in mobile hamburger menu.

Verification Checklist
----------------------

- [x] Jekyll site builds cleanly locally and on GitHub Pages.
- [x] `/mugs/` page renders product cards correctly.
- [x] Header navigation includes **Mugs** link.
- [x] Post footer promo banner appears on articles.
- [x] All "Buy on Printful" links resolve to correct Printful Quick Store items.
- [x] Responsive layout verified across mobile, tablet, and desktop views.
