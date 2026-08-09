/**
 * Main sync script entry point.
 *
 * Usage:
 *   node src/index.js merge  # run on push to main (post-merge Buttondown emails)
 *
 * Reads GITHUB_EVENT_PATH for push info, GITHUB_TOKEN for GitHub API calls.
 * Requires BUTTONDOWN_API_KEY and SITE_URL in environment.
 */
import fs from 'fs';
import axios from 'axios';
import { findPostDirsFromFiles, findArticleFilesFromFiles } from './find-post-dirs.js';
import { buttondownClient } from './buttondown-client.js';
import { bufferClient } from './buffer-client.js';
import {
  buildArticleEmailFromFile,
  buildNewsletterEmail,
  shouldPublishPost,
  getBufferMetadata,
  flipPublishFlag,
} from './buttondown-sync.js';

const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_EVENT_PATH || !fs.existsSync(GITHUB_EVENT_PATH)) {
  console.error('GITHUB_EVENT_PATH not found. This script must run in GitHub Actions with event context.');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));

async function handleMerge() {
  const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;
  if (!BUTTONDOWN_API_KEY) {
    console.error('Missing BUTTONDOWN_API_KEY in environment.');
    process.exit(1);
  }

  const SITE_URL = process.env.SITE_URL;
  if (!SITE_URL) {
    console.error('Missing SITE_URL in environment.');
    process.exit(1);
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const buttondown = buttondownClient({ apiKey: BUTTONDOWN_API_KEY });

  const BUFFER_ACCESS_TOKEN = process.env.BUFFER_ACCESS_TOKEN;
  const BUFFER_PROFILE_IDS_RAW = process.env.BUFFER_PROFILE_IDS;
  const bufferProfileIds = BUFFER_PROFILE_IDS_RAW
    ? BUFFER_PROFILE_IDS_RAW.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  let buffer = null;
  if (BUFFER_ACCESS_TOKEN && bufferProfileIds.length > 0) {
    buffer = bufferClient({ accessToken: BUFFER_ACCESS_TOKEN });
  } else {
    console.warn('[Buffer] BUFFER_ACCESS_TOKEN or BUFFER_PROFILE_IDS missing. Skipping Buffer social media sync.');
  }

  // Collect all changed files. Merge commits have empty added/modified arrays
  // in the push event payload, so prefer the GitHub Compare API. Fall back to
  // commit file lists only when the Compare API is unavailable.
  const before = event.before;
  const after = event.after;
  let allFiles;
  if (GITHUB_TOKEN && before && after && !/^0+$/.test(before)) {
    try {
      const headers = {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      };
      const url = `https://api.github.com/repos/${owner}/${repo}/compare/${before}...${after}`;
      const res = await axios.get(url, { headers });
      allFiles = (res.data.files || [])
        .filter((f) => f.status === 'added' || f.status === 'modified')
        .map((f) => f.filename);
    } catch (e) {
      console.warn(`Compare API failed (${e.message}), falling back to commit file lists.`);
      allFiles = (event.commits || []).flatMap((c) => [...(c.added || []), ...(c.modified || [])]);
    }
  } else {
    allFiles = (event.commits || []).flatMap((c) => [...(c.added || []), ...(c.modified || [])]);
  }
  const articleFiles = findArticleFilesFromFiles(allFiles).filter((f) => shouldPublishPost(f));
  const newsletterDirs = findPostDirsFromFiles(allFiles)
    .filter((d) => d.startsWith('content/newsletters/'))
    .filter((d) => shouldPublishPost(d));

  if (articleFiles.length === 0 && newsletterDirs.length === 0) {
    console.log('No article or newsletter changes with publish_post: true detected in push.');
    return;
  }

  for (const filePath of articleFiles) {
    console.log(`Processing article: ${filePath}`);
    const { subject, body } = await buildArticleEmailFromFile(filePath, SITE_URL);
    const draft = await buttondown.createDraftEmail(subject, body);
    console.log(`Created Buttondown draft for article ${filePath}: ${draft.absolute_url || draft.id}`);

    if (buffer) {
      try {
        const { text, publishTime } = getBufferMetadata(filePath, SITE_URL);
        const bufferRes = await buffer.createUpdate({
          profileIds: bufferProfileIds,
          text,
          scheduledAt: publishTime,
        });
        console.log(`Queued Buffer update for article ${filePath}: ${bufferRes.buffer_count || 'success'}`);
      } catch (e) {
        console.error(`Failed to queue Buffer update for article ${filePath}: ${e.message}`);
      }
    }

    flipPublishFlag(filePath);
    console.log(`Flipped publish_post flag to false for article: ${filePath}`);
  }

  for (const dir of newsletterDirs) {
    console.log(`Processing newsletter: ${dir}`);
    const { subject, body } = await buildNewsletterEmail(dir);
    const draft = await buttondown.createDraftEmail(subject, body);
    console.log(`Created Buttondown draft for newsletter ${dir}: ${draft.absolute_url || draft.id}`);

    if (buffer) {
      try {
        const { text, publishTime } = getBufferMetadata(dir, SITE_URL);
        const bufferRes = await buffer.createUpdate({
          profileIds: bufferProfileIds,
          text,
          scheduledAt: publishTime,
        });
        console.log(`Queued Buffer update for newsletter ${dir}: ${bufferRes.buffer_count || 'success'}`);
      } catch (e) {
        console.error(`Failed to queue Buffer update for newsletter ${dir}: ${e.message}`);
      }
    }

    flipPublishFlag(dir);
    console.log(`Flipped publish_post flag to false for newsletter: ${dir}`);
  }
}


async function run() {
  const mode = process.argv[2];
  if (mode === 'merge') {
    await handleMerge();
  } else {
    console.error('Unknown mode. Use "merge".');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
