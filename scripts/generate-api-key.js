const crypto = require('crypto');

// Generate a random 32-byte hex string
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('Generated API Key:', apiKey); 