const http = require('http');

async function test() {
  const loginData = await postJSON('http://localhost:3000/api/auth/login', {
    email: 'user@demo.com',
    password: 'password123'
  });

  if (!loginData.success) {
    console.log('Login failed', loginData);
    return;
  }

  const token = loginData.data.token;
  console.log('Login success');

  const campaignsData = await getJSON('http://localhost:3000/api/campaigns', token);
  console.log('Campaigns Result:', JSON.stringify(campaignsData, null, 2));
}

function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function getJSON(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.log('Raw output (not JSON):', data);
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

test().catch(console.error);
