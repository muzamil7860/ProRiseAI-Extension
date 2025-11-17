import crypto from 'crypto';

/**
 * Encryption utility for sensitive data like OpenAI API keys
 * Uses AES-256-GCM encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not found in environment variables');
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  return key;
}

/**
 * Derive encryption key from master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted string with format: salt:iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  const masterKey = getEncryptionKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(masterKey, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();

  // Combine salt, iv, authTag, and encrypted data
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * @param encryptedData - Encrypted string with format: salt:iv:authTag:encrypted
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty');
  }

  const masterKey = getEncryptionKey();
  const parts = encryptedData.split(':');
  
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');
  const encrypted = parts[3];

  const key = deriveKey(masterKey, salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash sensitive data (one-way, for verification only)
 * @param text - Text to hash
 * @returns Hashed string
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a secure random key
 * @param length - Length of the key (default: 32)
 * @returns Random hex string
 */
export function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Mask sensitive data for display
 * @param text - Text to mask
 * @param visibleChars - Number of characters to show at start and end
 * @returns Masked string
 */
export function maskSensitiveData(text: string, visibleChars: number = 4): string {
  if (!text || text.length <= visibleChars * 2) {
    return '••••••••';
  }
  const start = text.substring(0, visibleChars);
  const end = text.substring(text.length - visibleChars);
  const masked = '•'.repeat(Math.min(text.length - visibleChars * 2, 20));
  return `${start}${masked}${end}`;
}
