const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'orbit_super_secret_jwt_key_2026_production_ready';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

const clientToken = jwt.sign({ id: 'client_301', name: 'Rahul Sharma', role: 'CLIENT', email: 'rahul@orbit.com' }, JWT_SECRET);
const partner1Token = jwt.sign({ id: 'partner_101', name: 'Ali Khan', role: 'PARTNER', email: 'ali@orbit.com' }, JWT_SECRET);
const partner2Token = jwt.sign({ id: 'partner_102', name: 'Vikram Singh', role: 'PARTNER', email: 'vikram@orbit.com' }, JWT_SECRET);

console.log('=======================================================');
console.log('🚀 ORBIT DISPATCH SIMULATOR STARTING...');
console.log('=======================================================');

// Socket Partner 1 (1.2 km away)
const socketP1 = io(SERVER_URL, { auth: { token: partner1Token }, transports: ['websocket'] });

// Socket Partner 2 (3.5 km away)
const socketP2 = io(SERVER_URL, { auth: { token: partner2Token }, transports: ['websocket'] });

let p1ReceivedOffer = false;
let p2ReceivedOffer = false;

socketP1.on('connect', () => {
  console.log('[Partner 1] Connected to Socket. Going online...');
  socketP1.emit('partner_online');

  // Send GPS (Mumbai BKC area)
  setInterval(() => {
    socketP1.emit('partner_location', { lat: 19.0650, lng: 72.8680, speed: 12, heading: 45 });
  }, 5000);
});

socketP2.on('connect', () => {
  console.log('[Partner 2] Connected to Socket. Going online...');
  socketP2.emit('partner_online');

  // Send GPS (Mumbai Dadar area)
  setInterval(() => {
    socketP2.emit('partner_location', { lat: 19.0176, lng: 72.8461, speed: 20, heading: 180 });
  }, 5000);
});

socketP1.on('new_booking_request', (offer) => {
  console.log('\n[Partner 1 RECEIVED OFFER]:', offer);
  p1ReceivedOffer = true;

  const mode = process.argv[2] || 'accept';

  if (mode === 'accept') {
    console.log('👉 [Partner 1] ACCEPTING offer in 1.5s...');
    setTimeout(() => {
      socketP1.emit('booking_response', { bookingId: offer.bookingId, accepted: true });
    }, 1500);
  } else if (mode === 'reject') {
    console.log('👉 [Partner 1] REJECTING offer in 1s...');
    setTimeout(() => {
      socketP1.emit('booking_response', { bookingId: offer.bookingId, accepted: false, reason: 'Busy shooting' });
    }, 1000);
  } else if (mode === 'timeout') {
    console.log('👉 [Partner 1] IGNORING offer (Simulating 15s timeout failover)...');
  }
});

socketP1.on('booking_offer_confirmed', (data) => {
  console.log('\n✅ [Partner 1 ASSIGNED CONFIRMATION]:', data);
});

socketP2.on('new_booking_request', (offer) => {
  console.log('\n[Partner 2 RECEIVED FAILOVER OFFER]:', offer);
  p2ReceivedOffer = true;
  console.log('👉 [Partner 2] ACCEPTING offer in 2s...');
  setTimeout(() => {
    socketP2.emit('booking_response', { bookingId: offer.bookingId, accepted: true });
  }, 2000);
});

socketP2.on('booking_offer_confirmed', (data) => {
  console.log('\n✅ [Partner 2 ASSIGNED CONFIRMATION]:', data);
  console.log('\n🎉 SIMULATION COMPLETE! Closing sockets.');
  setTimeout(() => process.exit(0), 1000);
});

// Trigger Booking Creation after 2 seconds
setTimeout(() => {
  console.log('\n📲 CLIENT Triggering POST /api/bookings?sync=true...');

  const postData = JSON.stringify({
    lat: 19.0655,
    lng: 72.8690,
    address: 'Bandra Kurla Complex, Mumbai',
    price: 499
  });

  const req = http.request(`${SERVER_URL}/api/bookings?sync=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clientToken}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('\n📩 [CLIENT HTTP RESPONSE]:', JSON.parse(body));
    });
  });

  req.on('error', (err) => {
    console.error('HTTP Request failed:', err.message);
  });

  req.write(postData);
  req.end();
}, 2000);
