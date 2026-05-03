This holds the content for https://distractedfortune.com

CI and forked pull requests
--------------------------

The wp-sync workflow needs repository secrets (BOT_USERNAME and BOT_PASSWORD) to fetch a JWT token for the WordPress site. GitHub does not expose repository secrets to workflows triggered by pull requests from forks. If you open a PR from a fork, the workflow will fail early with a clear error message.

If you need to allow a job to use secrets for PRs from forks, consider moving the secret-using step into a `pull_request_target` workflow (see https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target) and take security precautions (do not run untrusted PR code before using secrets). For more about secrets and Actions, see https://docs.github.com/en/actions/security-guides/encrypted-secrets.
