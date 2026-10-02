
import { onRequestPost } from './dashboard/api/auth/delete-account.js';
import { getCloudflareD1 } from './dashboard/api/auth/cloudflareD1.js';

async function testHandler() {
  const db = getCloudflareD1();
  const env = { DB: db };
  
  // We need a real session ID to test the full flow, 
  // but we can at least check if the imports and initial logic work.
  const mockRequest = {
    url: 'http://localhost/api/auth/delete-account',
    method: 'POST',
    headers: {
      get: (name) => {
        if (name === 'Cookie') return 'lnx_session=MOCK_SESSION';
        return null;
      }
    }
  };

  const context = { request: mockRequest, env };

  try {
    console.log('Testing onRequestPost...');
    const response = await onRequestPost(context);
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('CRITICAL HANDLER ERROR:');
    console.error(err);
  }
}

testHandler();
