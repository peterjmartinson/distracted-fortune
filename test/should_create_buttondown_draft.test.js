import test from 'node:test';
import assert from 'node:assert/strict';
import { buttondownClient } from '../src/buttondown-client.js';

test('should_post_draft_email_to_buttondown_api', async () => {
  const requests = [];
  const fakeHttp = {
    async post(url, data, options) {
      requests.push({ url, data, options });
      return { data: { id: 'abc-123', absolute_url: 'https://buttondown.email/emails/abc-123' } };
    },
  };

  const client = buttondownClient({ apiKey: 'test-key', _httpClient: fakeHttp });
  const result = await client.createDraftEmail('My Subject', '<p>Hello</p>');

  assert.equal(requests.length, 1, 'should make exactly one HTTP request');
  assert.ok(requests[0].url.includes('/emails'), 'should call the /emails endpoint');
  assert.equal(result.id, 'abc-123');
});

test('should_send_status_draft_in_request_body', async () => {
  const requests = [];
  const fakeHttp = {
    async post(url, data, options) {
      requests.push({ url, data, options });
      return { data: { id: 'xyz-456' } };
    },
  };

  const client = buttondownClient({ apiKey: 'test-key', _httpClient: fakeHttp });
  await client.createDraftEmail('Subject', '<p>Body</p>');

  assert.equal(requests[0].data.status, 'draft', 'status must be draft');
  assert.equal(requests[0].data.subject, 'Subject');
  assert.equal(requests[0].data.body, '<p>Body</p>');
});

test('should_use_token_auth_header', async () => {
  const requests = [];
  const fakeHttp = {
    async post(url, data, options) {
      requests.push({ url, data, options });
      return { data: { id: 'xyz-456' } };
    },
  };

  const client = buttondownClient({ apiKey: 'secret-api-key', _httpClient: fakeHttp });
  await client.createDraftEmail('Subject', '<p>Body</p>');

  assert.equal(
    requests[0].options.headers.Authorization,
    'Token secret-api-key',
    'Authorization header must use Token scheme',
  );
});
