import axios from 'axios';

/**
 * Creates a Buffer API client instance.
 *
 * @param {{ accessToken: string }} config
 * @returns {{ createUpdate: (options: { profileIds: string[], text: string, scheduledAt?: string, shorten?: boolean }) => Promise<any> }}
 */
export function bufferClient({ accessToken }) {
  if (!accessToken) {
    throw new Error('bufferClient requires an accessToken.');
  }

  return {
    /**
     * Post/schedule a social media update to target profile IDs.
     *
     * @param {{ profileIds: string[], text: string, scheduledAt?: string, shorten?: boolean }} options
     * @returns {Promise<any>} Response from Buffer API
     */
    async createUpdate({ profileIds, text, scheduledAt, shorten = false }) {
      if (!profileIds || profileIds.length === 0) {
        throw new Error('createUpdate requires at least one profile ID.');
      }
      if (!text) {
        throw new Error('createUpdate requires text content.');
      }

      const params = new URLSearchParams();
      for (const profileId of profileIds) {
        params.append('profile_ids[]', profileId);
      }
      params.append('text', text);
      if (scheduledAt) {
        params.append('scheduled_at', scheduledAt);
      }
      params.append('shorten', shorten ? 'true' : 'false');

      const response = await axios.post('https://api.bufferapp.com/1/updates/create.json', params, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    },
  };
}
