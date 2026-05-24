/**
 * buttondown-client.js — Buttondown API client.
 *
 * Wraps the Buttondown v1 REST API for creating draft emails.
 */
import axios from 'axios';

const BUTTONDOWN_API_BASE = 'https://api.buttondown.email/v1';

/**
 * Creates a Buttondown API client.
 *
 * @param {{ apiKey: string, _httpClient?: object }} options
 *   _httpClient is injectable for testing (defaults to axios).
 * @returns {{ createDraftEmail: Function }}
 */
export function buttondownClient({ apiKey, _httpClient = axios }) {
  const headers = {
    Authorization: `Token ${apiKey}`,
    'Content-Type': 'application/json',
  };

  return {
    /**
     * Create a new draft email in Buttondown.
     *
     * @param {string} subject
     * @param {string} body - HTML content
     * @returns {Promise<{ id: string, absolute_url: string }>}
     */
    async createDraftEmail(subject, body) {
      const res = await _httpClient.post(
        `${BUTTONDOWN_API_BASE}/emails`,
        { subject, body, status: 'draft' },
        { headers },
      );
      return res.data;
    },
  };
}
