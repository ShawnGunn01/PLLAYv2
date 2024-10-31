const crypto = require('crypto');

function encryptScore(score, key) {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(12);
  const salt = crypto.randomBytes(16);
  
  // Derive key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  
  // Create cipher
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  
  // Encrypt score
  const scoreString = JSON.stringify(score);
  const encrypted = Buffer.concat([
    cipher.update(scoreString, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Combine all components
  return {
    data: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    authTag: authTag.toString('base64')
  };
}