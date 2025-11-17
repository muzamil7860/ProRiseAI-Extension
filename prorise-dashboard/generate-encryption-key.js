// Generate a secure 64-character encryption key for OpenAI API key storage
// Run this file with: node generate-encryption-key.js

const crypto = require('crypto');

console.log('\n=== ProRise AI - Encryption Key Generator ===\n');
console.log('Generated Encryption Key (64 characters):');
console.log('\n' + crypto.randomBytes(32).toString('hex') + '\n');
console.log('Add this to your .env file as:');
console.log('ENCRYPTION_KEY="<paste-key-here>"\n');
console.log('⚠️  Keep this key secure and never commit it to version control!\n');
