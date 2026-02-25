// Lightweight WP REST client helpers (uses Basic auth via WP Application Password)
const axios = require('axios');
const FormData = require('form-data');

function makeAuthHeader(user, appPassword) {
  const token = Buffer.from(`${user}:${appPassword}`).toString('base64');
  return `Basic ${token}`;
}

function wpClient({ wpUrl, user, appPassword }) {
  const base = wpUrl.replace(/\/+$/, '') + '/wp-json/wp/v2';
  const auth = makeAuthHeader(user, appPassword);
  const client = axios.create({
    baseURL: base,
    headers: {
      Authorization: auth,
      Accept: 'application/json'
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return {
    async findOrCreateTerm(endpoint, name) {
      // endpoint: 'tags' or 'categories'
      // case-insensitive search
      const searchRes = await client.get(`/${endpoint}`, { params: { search: name, per_page: 100 } });
      const found = searchRes.data.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (found) return found.id;
      const createRes = await client.post(`/${endpoint}`, { name });
      return createRes.data.id;
    },

    async uploadMedia(filePathStream, filename, { title, alt_text, caption } = {}) {
      const form = new FormData();
      form.append('file', filePathStream, { filename });
      if (title) form.append('title', title);
      if (caption) form.append('caption', caption);
      if (alt_text) form.append('alt_text', alt_text);

      const headers = Object.assign({}, form.getHeaders(), { Authorization: auth });
      const res = await axios.post(base.replace('/wp/v2', '') + '/wp/v2/media', form, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      return res.data; // contains id, source_url, etc.
    },

    async createPost(payload) {
      const res = await client.post('/posts', payload);
      return res.data;
    },

    async updatePost(id, payload) {
      const res = await client.post(`/posts/${id}`, payload);
      return res.data;
    },

    async getPost(id) {
      const res = await client.get(`/posts/${id}`);
      return res.data;
    }
  };
}

module.exports = { wpClient };