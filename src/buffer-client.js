import axios from 'axios';

/**
 * Creates a Buffer API client instance using Buffer's GraphQL API.
 *
 * @param {{ accessToken: string, _httpClient?: object }} config
 * @returns {{ createUpdate: (options: { profileIds: string[], text: string, scheduledAt?: string, shorten?: boolean }) => Promise<any> }}
 */
export function bufferClient({ accessToken, _httpClient = axios }) {
  if (!accessToken) {
    throw new Error('bufferClient requires an accessToken.');
  }

  return {
    /**
     * Post/schedule a social media update to target channel/profile IDs via GraphQL.
     *
     * @param {{ profileIds: string[], text: string, scheduledAt?: string, shorten?: boolean }} options
     * @returns {Promise<any>} Summary object with buffer_count and response results
     */
    async createUpdate({ profileIds, text, scheduledAt, shorten = false }) {
      if (!profileIds || profileIds.length === 0) {
        throw new Error('createUpdate requires at least one profile ID.');
      }
      if (!text) {
        throw new Error('createUpdate requires text content.');
      }

      const mutation = `
        mutation CreatePost($channelId: String!, $text: String!, $scheduledAt: String) {
          createPost(channelId: $channelId, text: $text, scheduledAt: $scheduledAt) {
            id
          }
        }
      `.trim();

      const results = [];
      for (const profileId of profileIds) {
        const variables = {
          channelId: profileId,
          text,
        };
        if (scheduledAt) {
          variables.scheduledAt = scheduledAt;
        }

        const response = await _httpClient.post(
          'https://api.buffer.com/graphql',
          {
            query: mutation,
            variables,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data && response.data.errors && response.data.errors.length > 0) {
          const errorMessages = response.data.errors.map((e) => e.message).join('; ');
          throw new Error(`Buffer GraphQL Error: ${errorMessages}`);
        }

        results.push(response.data);
      }

      return {
        buffer_count: results.length,
        results,
      };
    },
  };
}
