## Summary
Transition all blog post emailing from WordPress/Jetpack to Buttondown. The new workflow will distinguish between "articles" (published to WordPress and excerpt/link emailed) and "newsletters" (emailed via Buttondown only, not published to WordPress).

## Background
- Buttondown account has been created.
- All Jetpack subscribers have been migrated to Buttondown.
- Posts are categorized as either "articles" or "newsletters" in the repo.
   - **Articles:** Currently sent to WordPress, post-edited, and emailed via Jetpack/WordPress.
   - **Newsletters:** Currently also sent to WordPress and emailed, but should not be.
- Present workflow sends everything to WordPress on PR and you handle emailing/posting manually from there.

## Goal
- On PR (for either an article or newsletter):
   - **Only articles:** Should be pushed to WordPress for preview/publication. Newsletters should NOT go to WordPress at all, only exist in the repo/PR.
- On PR merged:
   - **Articles:** Only an excerpt and link should be emailed via Buttondown (not full content).
   - **Newsletters:** The full content should be emailed to subscribers via Buttondown, but not published to WordPress.
- **Optional (ideal for now):** After PR merge, create a draft in Buttondown to review layout and appearance before sending. You do the final "send" manually in Buttondown until the workflow is totally trusted.

## Implementation Tasks
1. Update GitHub Actions/workflows:
    - Detect if content is an article or newsletter based on path/metadata/frontmatter.
    - On PR open:
         - If article, create draft post on WordPress only.
         - If newsletter, do nothing with WordPress.
    - On PR merge:
        - If article, send excerpt + link via Buttondown (automate via API and repo secrets). Optionally, create as draft in Buttondown for review.
        - If newsletter, send full content via Buttondown. Optionally, create as draft in Buttondown.
2. Configure and securely store Buttondown API secrets in repo/Actions.
3. Update documentation/readme for new publishing process for both article & newsletter workflows.
4. Clean up/deprecate old Jetpack/WordPress email logic.

## Acceptance Criteria
- Only articles go to WordPress; newsletters never appear in WordPress.
- On merge, Buttondown emails are created for both articles (excerpt & link) and newsletters (full content).
- Buttondown emails can be reviewed/sent manually during the transition.
- No emails are sent by Jetpack/WordPress.

## Notes
- Retain the ability to manually trigger/override in Buttondown until you're confident with automation.
- Old issue (#24) can be closed in favor of this clearer workflow definition.

---

*This issue replaces #24 for clarity and practical workflow migration direction.*