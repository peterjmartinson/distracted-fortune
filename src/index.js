/**
 * Main sync script entry point.
 *
 * Usage:
 *   node src/index.js pr     # run on pull_request opened/synchronize/reopened
 *   node src/index.js merge  # run on push to main (post-merge Buttondown emails)
 *
 * Reads GITHUB_EVENT_PATH for PR/push info, GITHUB_TOKEN for GitHub API calls.
 * Requires WP_URL, WP_USER, WP_APP_PASSWORD in environment (pr mode only).
 * Requires BUTTONDOWN_API_KEY in environment (merge mode only).
 */
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import matter from 'gray-matter';
import { wpClient } from './wp-client.js';
import { createOrUpdateDraftFromDir } from './sync.js';
import { findPostDirsFromFiles } from './find-post-dirs.js';
import { buttondownClient } from './buttondown-client.js';
import { buildArticleEmail, buildNewsletterEmail } from './buttondown-sync.js';

const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_EVENT_PATH || !fs.existsSync(GITHUB_EVENT_PATH)) {
  console.error('GITHUB_EVENT_PATH not found. This script must run in GitHub Actions with event context.');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));

function makePrHelpers(token, owner, repo) {
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };
  return {
    async readMapping(prNumber) {
      const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
      const res = await axios.get(url, { headers });
      for (const c of res.data.reverse()) {
        const m =
          c.body &&
          c.body.match(
            /<!-- wp-sync[\s\S]*?post_id:\s*(\d+)[\s\S]*?post_url:\s*(\S+)[\s\S]*?-->/i,
          );
        if (m) return { post_id: parseInt(m[1], 10), post_url: m[2] };
      }
      return null;
    },
    async writeMapping(prNumber, postId, postUrl, slug, date) {
      const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
      const body = [
        `WP draft created: ${postUrl}`,
        '',
        `<!-- wp-sync`,
        `post_id: ${postId}`,
        `post_url: ${postUrl}`,
        `post_slug: ${slug || ''}`,
        `post_date: ${date || ''}`,
        `-->`,
      ].join('\n');
      await axios.post(url, { body }, { headers });
    },
    async commentOnPR(prNumber, message) {
      const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
      await axios.post(url, { body: message }, { headers });
    },
  };
}

async function handlePR() {
  const pr = event.pull_request;
  if (!pr) {
    console.log('No pull_request in event.');
    return;
  }

  const WP_URL = process.env.WP_URL;
  const WP_USER = process.env.WP_USER;
  const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

  if (!WP_URL || !WP_USER || !WP_APP_PASSWORD) {
    console.error('Missing WP_URL, WP_USER, or WP_APP_PASSWORD in environment.');
    process.exit(1);
  }

  const wp = wpClient({ wpUrl: WP_URL, user: WP_USER, appPassword: WP_APP_PASSWORD });

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const filesUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/files`;
  const filesRes = await axios.get(filesUrl, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  });
  const files = filesRes.data.map((f) => f.filename);
  const allDirs = findPostDirsFromFiles(files);

  // Newsletters are not synced to WordPress — only articles go to WP on PR.
  const postDirs = allDirs.filter((d) => d.startsWith('content/posts/'));

  if (postDirs.length === 0) {
    console.log('No article draft.md changes detected (newsletters are skipped for WP sync).');
    return;
  }
  console.log('Article dirs to sync to WP:', postDirs);
  const prHelpers = makePrHelpers(GITHUB_TOKEN, owner, repo);
  for (const postDir of postDirs) {
    await createOrUpdateDraftFromDir(postDir, pr.number, wp, prHelpers);
  }
}

/**
 * Look up the WordPress post URL for a commit by finding the PR that introduced
 * it and reading the wp-sync mapping stored in PR comments.
 *
 * @param {string} sha
 * @param {string} owner
 * @param {string} repo
 * @param {{ readMapping: Function }} prHelpers
 * @returns {Promise<string|null>}
 */
async function lookupWpPostUrl(sha, owner, repo, prHelpers) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/pulls`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    const prs = res.data;
    if (!prs || prs.length === 0) {
      console.warn(`No PRs found for commit ${sha}`);
      return null;
    }
    const mapping = await prHelpers.readMapping(prs[0].number);
    return mapping ? mapping.post_url : null;
  } catch (e) {
    console.error(`Failed to look up PR for commit ${sha}: ${e.message}`);
    return null;
  }
}

async function handleMerge() {
  const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;
  if (!BUTTONDOWN_API_KEY) {
    console.error('Missing BUTTONDOWN_API_KEY in environment.');
    process.exit(1);
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const buttondown = buttondownClient({ apiKey: BUTTONDOWN_API_KEY });
  const prHelpers = makePrHelpers(GITHUB_TOKEN, owner, repo);

  // Collect all changed files across every commit in this push.
  const commits = event.commits || [];
  const allFiles = commits.flatMap((c) => [...(c.added || []), ...(c.modified || [])]);
  const dirs = findPostDirsFromFiles(allFiles);

  if (dirs.length === 0) {
    console.log('No content draft.md changes detected in push.');
    return;
  }
  console.log('Content dirs changed on merge:', dirs);

  const headSha = event.after || (event.head_commit && event.head_commit.id);

  for (const dir of dirs) {
    const isNewsletter = dir.startsWith('content/newsletters/');

    if (isNewsletter) {
      const { subject, body } = await buildNewsletterEmail(dir);
      const draft = await buttondown.createDraftEmail(subject, body);
      console.log(`Created Buttondown draft for newsletter ${dir}: ${draft.absolute_url || draft.id}`);
    } else {
      // Article: retrieve the WP post URL from the merged PR's comment mapping.
      const wpPostUrl = headSha
        ? await lookupWpPostUrl(headSha, owner, repo, prHelpers)
        : null;

      if (!wpPostUrl) {
        console.warn(`Could not find WP post URL for ${dir} — skipping Buttondown email.`);
        continue;
      }

      const mdPath = path.join(dir, 'draft.md');
      const raw = fs.readFileSync(mdPath, 'utf8');
      const front = matter(raw).data;
      const { subject, body } = buildArticleEmail(front, wpPostUrl);
      const draft = await buttondown.createDraftEmail(subject, body);
      console.log(`Created Buttondown draft for article ${dir}: ${draft.absolute_url || draft.id}`);
    }
  }
}

async function run() {
  const mode = process.argv[2];
  if (mode === 'pr') {
    await handlePR();
  } else if (mode === 'merge') {
    await handleMerge();
  } else {
    console.error('Unknown mode. Use "pr" or "merge".');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
