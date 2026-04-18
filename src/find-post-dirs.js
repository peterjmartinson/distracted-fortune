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
