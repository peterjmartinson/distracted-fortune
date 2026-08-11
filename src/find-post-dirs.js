/**
 * Returns an array of unique content directories that contain a changed
 * `draft.md` file, matching both `content/posts/` and `content/newsletters/`.
 *
 * @param {string[]} files - list of file paths from a pull-request diff
 * @returns {string[]}
 */
export function findPostDirsFromFiles(files) {
  const set = new Set();
  for (const f of files) {
    const m = f.match(/^content\/(posts|newsletters)\/([^/]+)\/draft\.md$/);
    if (m) set.add(`content/${m[1]}/${m[2]}`);
  }
  return Array.from(set);
}

/**
 * Returns an array of `_posts/` file paths that match the Jekyll naming
 * convention `_posts/YYYY-MM-DD-slug.md`.
 *
 * @param {string[]} files - list of file paths from a push/compare diff
 * @returns {string[]}
 */
export function findArticleFilesFromFiles(files) {
  return files.filter((f) => /^_posts\/\d{4}-\d{2}-\d{2}-.+\.md$/.test(f));
}
