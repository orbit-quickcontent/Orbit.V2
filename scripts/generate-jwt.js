const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'orbit_super_secret_jwt_key_2026_production_ready';

const clientPayload = {
  id: 'client_301',
  name: 'Rahul Sharma (Client)',
  email: 'rahul@example.com',
  role: 'CLIENT'
};

const partner1Payload = {
  id: 'partner_101',
  name: 'Ali Khan (Videographer Partner #1 - Close)',
  email: 'ali@example.com',
  role: 'PARTNER'
};

const partner2Payload = {
  id: 'partner_102',
  name: 'Vikram Singh (Videographer Partner #2 - Farther)',
  email: 'vikram@example.com',
  role: 'PARTNER'
};

const editorPayload = {
  id: 'editor_501',
  name: 'Priya Verma (Reel Editor)',
  email: 'priya@example.com',
  role: 'EDITOR'
};

const adminPayload = {
  id: 'admin_901',
  name: 'Orbit Admin',
  email: 'admin@orbit.com',
  role: 'ADMIN'
};

console.log('=======================================================');
console.log('🔑 ORBIT DISPATCH - TEST JWT GENERATOR');
console.log('=======================================================');
console.log('\n[CLIENT TOKEN]:');
console.log(jwt.sign(clientPayload, JWT_SECRET, { expiresIn: '7d' }));

console.log('\n[PARTNER #1 TOKEN (Close - 1.2km)]');
console.log(jwt.sign(partner1Payload, JWT_SECRET, { expiresIn: '7d' }));

console.log('\n[PARTNER #2 TOKEN (Farther - 3.5km)]');
console.log(jwt.sign(partner2Payload, JWT_SECRET, { expiresIn: '7d' }));

console.log('\n[EDITOR TOKEN]');
console.log(jwt.sign(editorPayload, JWT_SECRET, { expiresIn: '7d' }));

console.log('\n[ADMIN TOKEN]');
console.log(jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '7d' }));
console.log('=======================================================');
