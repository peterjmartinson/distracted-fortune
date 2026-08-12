# Buffer Social Media Integration — Setup Guide

This guide provides step-by-step instructions for creating a Buffer account, connecting your social media accounts, generating an API Access Token, obtaining profile IDs, and configuring GitHub Repository Secrets.

---

## 1. Create a Free Buffer Account

1. Go to [buffer.com](https://buffer.com/) and click **Get started now** or **Sign Up**.
2. Create an account using your email or Google account.
3. Choose the Free Plan (or starter trial). The free plan allows connecting up to 3 social channels.

---

## 2. Connect Your Social Media Channels

1. Log into your Buffer dashboard.
2. Navigate to **Channels** (or **Manage Channels**).
3. Connect your target channels:
   - **LinkedIn**: Personal Profile or Company Page
   - **X (Twitter)**: Account authorization
   - **Facebook**: Facebook Page or Group *(Note: Meta API restrict automated posting to personal Facebook profiles; Facebook Pages are supported)*.
4. Follow the OAuth prompts to authorize Buffer for each channel.

---

## 3. Generate an API Access Token

1. Go to the [Buffer Developer Portal](https://buffer.com/developers).
2. If prompted, sign in with your Buffer account.
3. Click **Create an App** (or Access Tokens).
4. Fill in the basic app details:
   - **App Name**: `Distracted Fortune Sync` (or similar)
   - **Main URL**: `https://distractedfortune.com`
   - **Redirect URI**: `urn:ietf:wg:oauth:2.0:oob` (or `http://localhost`)
5. Click **Create Application**.
6. Under your created app settings, copy the **Access Token** (Personal Access Token).
   - Keep this token secret! It allows posting on your behalf.

---

## 4. Retrieve Profile IDs

You need the unique ID string for each connected profile (LinkedIn, X, Facebook).

### Option A: Via URL in Buffer Dashboard (Easiest)
1. Log into the Buffer dashboard.
2. Click on each channel in the left panel.
3. Look at your browser's address bar URL:
   `https://publish.buffer.com/profile/<PROFILE_ID>`
4. Copy the `<PROFILE_ID>` for each profile (e.g., `64a8b1234567890abcdef123`).

### Option B: Via Buffer API (`curl`)
Run the following terminal command (replace `<YOUR_ACCESS_TOKEN>` with your token):
```bash
curl -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" https://api.bufferapp.com/1/profiles.json
```
The response will be a JSON array of profiles. Copy the `id` field from each profile object.

---

## 5. Add Secrets to GitHub Repository

1. Go to your GitHub repository in your browser: `https://github.com/<owner>/<repo>`.
2. Click **Settings** -> **Secrets and variables** -> **Actions**.
3. Click **New repository secret**.
4. Add Secret 1:
   - **Name**: `BUFFER_ACCESS_TOKEN`
   - **Secret**: Paste your Access Token from Step 3.
5. Add Secret 2:
   - **Name**: `BUFFER_PROFILE_IDS`
   - **Secret**: Comma-separated list of profile IDs from Step 4 (e.g., `64a8b123...,64a8c456...,64a8d789...`).
6. Click **Add Secret**.

---

## 6. How the Workflow Uses Buffer

When a blog article or newsletter is merged into `main` with `publish_post: true` in its frontmatter:
- The GitHub Actions workflow extracts the title, excerpt, and URL.
- It formats a post update and sends a POST request to Buffer's GraphQL API (`https://api.buffer.com/graphql`) using the `createPost` mutation.
- If `publish_time: "YYYY-MM-DD HH:MM"` is set in the frontmatter, Buffer schedules the post for that exact time. If omitted, Buffer queues it according to your account's posting schedule.
- The workflow then auto-flips `publish_post: false` in git and commits the update.
