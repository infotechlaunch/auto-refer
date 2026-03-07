const API_URL = 'http://localhost:3000/api';

async function testQRCodeConnection() {
  console.log('🔄 Starting QR Code Connection Test...\n');

  try {
    // 1. Login to get authentication token
    console.log('🔑 Attempting to login as admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@itl.com',
        password: 'password123',
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok || !loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const token = loginData.token;
    console.log('✅ Login successful, token received.\n');

    // Headers with authentication token
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Test GET /api/qr-codes
    console.log('📡 Fetching existing QR Codes...');
    const qrResponse = await fetch(`${API_URL}/qr-codes`, { headers });
    const qrData = await qrResponse.json();
    
    if (qrResponse.ok && qrData.success) {
      console.log(`✅ Successfully fetched ${qrData.count} QR codes.`);
      console.log('📄 QR Codes data length:', qrData.data && qrData.data.length);
    } else {
      console.error('❌ Failed to fetch QR codes:', qrData);
    }
    console.log();

    // 3. Test GET /api/campaigns to get a valid campaignId
    console.log('📡 Fetching campaigns to test QR code creation...');
    const campaignResponse = await fetch(`${API_URL}/campaigns`, { headers });
    const campaignData = await campaignResponse.json();
    
    let campaignId = null;
    if (campaignResponse.ok && campaignData.success && campaignData.data && campaignData.data.length > 0) {
      // Find a campaign to use for generating a QR Code
      campaignId = campaignData.data[0].campaignId || campaignData.data[0].id;
      console.log(`✅ Found campaign with ID: ${campaignId}\n`);
      
      // 4. Test POST /api/qr-codes
      console.log('📡 Testing QR Code Generation...');
      const createResponse = await fetch(`${API_URL}/qr-codes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ campaignId })
      });
      const createData = await createResponse.json();

      if (createResponse.ok && createData.success) {
        console.log('✅ QR Code generated successfully:');
        console.log(createData.data);
      } else {
        console.error('❌ Failed to generate QR Code:', createData);
      }
    } else {
      console.log('⚠️ No campaigns found to test QR code generation.', campaignData);
    }

    console.log('\n🎉 Test Completed Successfully!');

  } catch (err) {
    console.error('\n❌ Test Failed:');
    console.error(err.message);
  }
}

testQRCodeConnection();
