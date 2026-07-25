Summary
-------

Set up the Printful account, Quick Store, product catalog (Math Mugs), payment processing, and API access required to power the Math Mugs store on https://distractedfortune.com.

Motivation
----------

- Enable print-on-demand fulfillment for "Math Mugs" white ceramic coffee mugs featuring mathematical proofs and graphics.
- Use Printful Quick Stores so Printful manages checkout, payment processing, manufacturing, shipping, and customer support with zero inventory risk.
- Obtain Printful API credentials so the GitHub blog can automatically sync store products and links via GitHub Actions.

Prerequisites & Requirements
----------------------------

- A Printful account (https://www.printful.com).
- High-resolution graphics or vector files for Math Mug proofs.
- Stripe account or bank account for receiving profit payouts.

Setup Steps (Printful Side)
---------------------------

### 1. Create a Printful Quick Store
1. Log in to Printful.
2. Go to **Stores** in the left sidebar → click **Choose platform** / **Add Store**.
3. Select **Printful Quick Store** (Pop-up Store).
4. Name the store (e.g., `Distracted Fortune Math Mugs`).
5. Customize store branding (logo/header if prompted) and note your public store URL (e.g., `https://distractedfortune.printful.me`).

### 2. Create and Publish "Math Mugs" Products
1. In the Quick Store dashboard, click **Add Product**.
2. Select **White Glossy Mug** (11 oz / 15 oz) or desired ceramic mug base.
3. Upload print designs for each Math Mug (e.g., Euler's Identity, Fermat's Last Theorem, Prime Number proofs).
4. Configure mockups and set pricing / profit margins for each item.
5. Save and publish products to the Quick Store catalog.
6. Copy the direct product URL for each published mug.

### 3. Configure Stripe Payouts & KYC Verification
1. Navigate to **Billing** / **Payout Settings** in Printful.
2. Complete **Stripe Onboarding** for direct profit payouts.
3. Complete standard identity/tax verification (SSN/EIN or business info).
4. Verify that payouts are configured (profits paid out monthly once balance exceeds $25 USD).

### 4. Generate Printful API Access Token
1. Go to **Settings** → **API** / **Developer API** (or **Integrations** → **API**).
2. Create a new **API Token** / **Private Token** with `read` access for `products` and `stores`.
3. Copy the API Key secret.
4. Save this token securely—it will be added to the GitHub repository secrets as `PRINTFUL_API_KEY` for automated site syncing.

Verification Checklist
----------------------

- [x] Printful Quick Store is active and accessible via public URL.
- [x] At least one Math Mug product is published and visible on the Quick Store.
- [x] Test clicking checkout on a product to confirm Stripe checkout loads properly.
- [x] Stripe payout account is connected and verified.
- [x] `PRINTFUL_API_KEY` is generated and ready to add to GitHub Repository Secrets.
