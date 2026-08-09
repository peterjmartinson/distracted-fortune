# Issue #73: Buffer Social Media Sync

## Goal

Extend the merge-sync workflow to automatically queue social media announcements on LinkedIn, X (Twitter), and Facebook using the **Buffer API** when a new article or newsletter is merged.

This issue assumes the flag renaming and auto-flip mechanism from Issue #72 are already completed. The flag `sync_to_buttondown` is replaced by `publish_post`.

## Jekyll Frontmatter Configuration

Articles and newsletters will use the following two keys:
- `publish_post: true` (tells the workflow to sync to Buttondown and queue to Buffer; will be auto-flipped to `false` post-sync).
- `publish_time: "YYYY-MM-DD HH:MM"` (tells Buffer when to release the social media updates. Format should be ISO or standard parseable datetime, e.g., `2026-08-10 13:00`).

## Implementation Details

1. **Script Update (`src/index.js` or new module)**:
   - If `publish_post: true` is found in the merged post/newsletter, read `publish_time` along with the post's title, excerpt, and URL.
   - Send a POST request to Buffer's API endpoint (`POST https://api.bufferapp.com/1/updates/create.json`) to create a scheduled update for each profile.
   - The payload should include:
     - `profile_ids[]`: Array of connected profile IDs (X, LinkedIn, Facebook).
     - `text`: Structured message (e.g., `"New post: [Title] - [Excerpt] [URL]"`).
     - `scheduled_at`: The datetime parsed from `publish_time`.
     - `shorten`: `false` (to avoid double-shortening URLs).

2. **Workflow secrets integration**:
   - `BUFFER_ACCESS_TOKEN`
   - `BUFFER_PROFILE_IDS` (a comma-separated list of the profile IDs to target).

## Human-in-the-Loop Setup Instructions

To get this working, the repository owner needs to perform the following manual setup steps:

1. **Setup Buffer Account**:
   - Create a free account on [Buffer](https://buffer.com).
   - Connect up to 3 social accounts (e.g., your LinkedIn profile, X/Twitter profile, and Facebook Page).

2. **Generate API Access Token**:
   - Go to the [Buffer Developer Portal](https://buffer.com/developers) or Register an App in your Buffer settings to generate a Personal Access Token.

3. **Retrieve Profile IDs**:
   - Query the Buffer API using curl/Postman to list your connected profiles and copy their ID strings:
     ```bash
     curl -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" https://api.bufferapp.com/1/profiles.json
     ```
   - Alternatively, when logged into the Buffer dashboard, click on each channel page and grab the ID from the URL (e.g., `https://publish.buffer.com/profile/<PROFILE_ID>`).

4. **Add Secrets to GitHub Repository**:
   - Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions**.
   - Add the following repository secrets:
     - `BUFFER_ACCESS_TOKEN`: The API token generated in step 2.
     - `BUFFER_PROFILE_IDS`: Comma-separated list of your profile IDs (e.g. `64a8b...,64a8c...`).

## Acceptance Criteria

- [ ] Frontmatter flag `publish_post: true` and `publish_time` field parsed correctly by sync script.
- [ ] Integration with Buffer API (`POST /1/updates/create.json`) schedules social posts for target profile IDs.
- [ ] GitHub repository secrets `BUFFER_ACCESS_TOKEN` and `BUFFER_PROFILE_IDS` configured.
- [ ] Workflow auto-flips `publish_post` to `false` after successfully queuing social posts and syncing Buttondown.
