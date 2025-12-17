require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const FACEBOOK_API_VERSION = 'v21.0';
const GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const PAGE_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

// ---------------- CONFIG ----------------
const POST_CONFIG = {
  message: 'Insurance is not for you. It’s for the people you love. ❤️',
  imageUrl: 'https://storage.googleapis.com/ugc-tik-tok/ChatGPT%20Image%20Dec%2018%2C%202025%2C%2002_17_30%20AM.png'
};
// ----------------------------------------

// 🔍 Check token validity & expiry
async function debugToken(token) {
  const { data } = await axios.get(
    `${GRAPH_URL}/debug_token`,
    { params: { input_token: token, access_token: token } }
  );

  return data.data;
}

// 📌 Validate token before posting
async function validatePageToken() {
  console.log('🔍 Validating Facebook token...');

  const debug = await debugToken(PAGE_TOKEN);

  console.log('Token Type:', debug.type);
  console.log('Expires At:', debug.expires_at === 0 ? 'Never (Permanent)' : new Date(debug.expires_at * 1000));
  console.log('Scopes:', debug.scopes);

  if (debug.type !== 'PAGE') {
    throw new Error('❌ Token is NOT a Page Access Token');
  }

  if (
    !debug.scopes.includes('pages_manage_posts') ||
    !debug.scopes.includes('pages_read_engagement')
  ) {
    throw new Error('❌ Missing required permissions');
  }

  console.log('✅ Token is valid and usable\n');
}

// 📝 Post text
async function postText(message) {
  const res = await axios.post(
    `${GRAPH_URL}/${PAGE_ID}/feed`,
    null,
    {
      params: {
        message,
        access_token: PAGE_TOKEN
      }
    }
  );
  return res.data;
}

// 🖼️ Post image
async function postImage(imageUrl, caption) {
  const form = new FormData();
  form.append('url', imageUrl);
  form.append('caption', caption);
  form.append('access_token', PAGE_TOKEN);

  const res = await axios.post(
    `${GRAPH_URL}/${PAGE_ID}/photos`,
    form,
    { headers: form.getHeaders() }
  );
  return res.data;
}

// 🚀 MAIN
(async function main() {
  try {
    if (!PAGE_ID || !PAGE_TOKEN) {
      throw new Error('❌ Missing FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN');
    }

    await validatePageToken();

    let result;
    if (POST_CONFIG.imageUrl) {
      console.log('📸 Posting image...');
      result = await postImage(POST_CONFIG.imageUrl, POST_CONFIG.message);
    } else {
      console.log('📝 Posting text...');
      result = await postText(POST_CONFIG.message);
    }

    console.log('✅ Post successful!');
    console.log('Post ID:', result.post_id || result.id);

  } catch (err) {
    console.error('❌ Failed:', err.response?.data || err.message);
    process.exit(1);
  }
})();
