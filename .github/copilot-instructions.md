# Distracted Fortune

Purpose
- Keep the codebase readable, testable, and safe to change.
- Prefer small, well-documented changes that are easy to review and revert.

Core Principles
1. Issue-first
   - All non-trivial code changes must reference an issue (e.g., in the PR description).
   - Work from the issue: it defines the goal, acceptance criteria, and scope.

2. Single Responsibility
   - Functions, modules, and scripts should do one thing and do it well.
   - If a unit is doing two things, split it into smaller, focused pieces.
   - Small units make code easier to test and review.

3. Test-driven mindset
   - Prefer writing a failing test before implementing a feature (TDD).
   - Every new feature or bugfix must include automated tests that prove the behavior.
   - Tests are documentation: they explain intended behavior and protect against regressions.

4. Tests verify one behavior
   - Each unit test should assert a single behavior or outcome.
   - Avoid bundling unrelated assertions in the same test.

5. Document changes
   - If a change affects usage, configuration, or observable behavior, update README.md or add a short docs/ entry.
   - Tests and README/docs updates should be part of the same PR when relevant.

Agent / Copilot behavior (VERY IMPORTANT)
- The coding agent / LLM / Copilot:
  - DOES NOT run git commands.
  - DOES NOT create, commit, push, or open pull requests on your behalf.
  - DOES NOT merge or change PR status.
- What the agent will do:
  - Produce suggested code changes, diffs, or full file contents.
  - Produce a suggested git commit message (Conventional Commits format) at the end of its work.
  - Prompt the user to commit the changes locally and open a PR.
  - Provide guidance on how to create the commit and open the PR (commands or UI steps), if asked.
- The user (repo owner / contributor) is the only one who must:
  - Commit changes to the repository.
  - Push branches to the remote.
  - Open and merge pull requests.

Practical Guidelines
- Language / tooling
  - Use the repository's existing toolchain and patterns. If you add new tooling, document why and how to use it in the issue/PR.
- Tests
  - Place tests where the project already organizes them.
  - Keep tests fast, deterministic, and focused.
  - Name tests clearly: `should_doX_when_conditionY`.
  - CI must run tests on every PR.
- Commits & PRs
  - Keep PRs small and focused — one logical change per PR.
  - Use Conventional Commits for commit messages (e.g., `feat:`, `fix:`, `chore:`).
  - PR description should include the issue number, summary, and any migration notes.
- Linting & formatting
  - Follow repo lint/format configuration. If none exists, propose adding one in an issue first.
- Backwards-compatibility
  - Document breaking changes and provide migration steps in the PR.
  - Avoid breaking changes in minor/patch releases.

PR Checklist (to include in PR template)
- [ ] Linked to an issue with acceptance criteria
- [ ] Tests added or updated for the change
- [ ] README or docs updated if public behavior changed
- [ ] Linting and formatting applied
- [ ] CI passes locally/on the server
- [ ] PR scope is limited to a single responsibility

Examples
- Good commit: `fix(images): correct alt text parsing for imported images`
- Good test name: `test_should_return_empty_list_when_no_matches`

Why this matters
- Small focused code + one-behavior tests = safer, faster reviews and fewer regressions.
- Clear docs mean future contributors can get up to speed quickly.