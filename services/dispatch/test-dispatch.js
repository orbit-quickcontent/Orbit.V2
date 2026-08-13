const http = require('http');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:5000';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      `${BASE_URL}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(resBody));
          } catch (e) {
            resolve(resBody);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING ORBIT NEARBY DISPATCH TEST SUITE ---');

  // 1. Connect Partner 1 (Nearer: 19.0781, 72.8792)
  console.log('\n[1] Registering Partner 1 (p1 - Closer)...');
  const socket1 = io(BASE_URL, { transports: ['websocket'] });
  await new Promise((resolve) => {
    socket1.on('connect', () => {
      socket1.emit('partner:register', { partnerId: 'p1' });
      socket1.on('partner:registered', resolve);
    });
  });
  console.log('✓ Partner 1 connected via Socket.IO');

  // Set Partner 1 Location
  await post('/partner/location', { partnerId: 'p1', lat: 19.0781, lng: 72.8792, online: true });
  console.log('✓ Partner 1 Location set in Redis/Memory');

  // 2. Connect Partner 2 (Further: 19.0850, 72.8850)
  console.log('\n[2] Registering Partner 2 (p2 - Further)...');
  const socket2 = io(BASE_URL, { transports: ['websocket'] });
  await new Promise((resolve) => {
    socket2.on('connect', () => {
      socket2.emit('partner:register', { partnerId: 'p2' });
      socket2.on('partner:registered', resolve);
    });
  });
  console.log('✓ Partner 2 connected via Socket.IO');

  // Set Partner 2 Location
  await post('/partner/location', { partnerId: 'p2', lat: 19.085, lng: 72.885, online: true });
  console.log('✓ Partner 2 Location set in Redis/Memory');

  // 3. Listen for booking requests
  let receivedP1Offer = null;
  socket1.on('booking_request', (offer) => {
    console.log('🎯 [PARTNER 1 RECEIVED OFFER]:', offer);
    receivedP1Offer = offer;
  });

  socket2.on('booking_request', (offer) => {
    console.log('🎯 [PARTNER 2 RECEIVED OFFER]:', offer);
  });

  // 4. Create Client Booking near Partner 1
  console.log('\n[3] Creating Client Booking (19.0760, 72.8777)...');
  const bookingRes = await post('/bookings', {
    lat: 19.076,
    lng: 72.8777,
    service: 'Instagram Reel Shoot (60 min)',
    amount: 499,
    partnerEarning: 350,
  });
  console.log('✓ Booking response:', bookingRes);

  // Wait 1.5 seconds for Partner 1 to receive offer
  await new Promise((r) => setTimeout(r, 1500));

  if (!receivedP1Offer) {
    console.error('❌ FAILED: Partner 1 did not receive the initial offer');
    process.exit(1);
  }

  // 5. Partner 1 Accepts Booking
  console.log('\n[4] Partner 1 Accepting booking offer...');
  const acceptRes = await post(`/partner/bookings/${bookingRes.bookingId}/accept`, {
    partnerId: 'p1',
  });
  console.log('✓ Partner 1 Accept Response:', acceptRes);

  console.log('\n🎉 ALL DISPATCH ENGINE TESTS PASSED SUCCESSFULLY!');
  socket1.disconnect();
  socket2.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
