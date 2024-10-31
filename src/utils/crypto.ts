import CryptoJS from 'crypto-js';
import { Score, EncryptedScore } from '../types';

export function encryptScore(score: Score, key: string): EncryptedScore {
  // Generate random IV and salt
  const iv = CryptoJS.lib.WordArray.random(12);
  const salt = CryptoJS.lib.WordArray.random(16);

  // Derive key using PBKDF2
  const derivedKey = CryptoJS.PBKDF2(key, salt, {
    keySize: 256 / 32,
    iterations: 100000
  });

  // Encrypt score
  const scoreString = JSON.stringify(score);
  const encrypted = CryptoJS.AES.encrypt(scoreString, derivedKey, {
    iv: iv,
    mode: CryptoJS.mode.GCM,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    data: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Base64),
    salt: salt.toString(CryptoJS.enc.Base64),
    authTag: encrypted.tag.toString(CryptoJS.enc.Base64),
    encrypted: true
  };
}