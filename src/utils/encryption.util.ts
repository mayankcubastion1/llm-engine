import * as crypto from 'crypto';
import * as fernet from 'fernet';

const API_KEY_ENCRYPTION_KEY = 'default-secret-key-change-in-production';

function getSecret(): Buffer {
  const hash = crypto.createHash('sha256');
  hash.update(API_KEY_ENCRYPTION_KEY);
  return hash.digest();
}

function getFernetToken(): fernet.Token {
  const secret = getSecret();
  const fernetSecret = new fernet.Secret(secret.toString('base64').replace(/\+/g, '-').replace(/\//g, '_'));
  return new fernet.Token({
    secret: fernetSecret,
    ttl: 0
  });
}

export function encryptApiKey(apiKey: string): string {
  try {
    console.log(JSON.stringify({
      level: 'debug',
      message: 'Encrypting API key',
      keyLength: apiKey.length,
      timestamp: new Date().toISOString()
    }));

    const token = getFernetToken();
    const encrypted = token.encode(apiKey);

    console.log(JSON.stringify({
      level: 'debug',
      message: 'API key encrypted successfully',
      encryptedLength: encrypted.length,
      timestamp: new Date().toISOString()
    }));

    return encrypted;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to encrypt API key',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }));
    throw error;
  }
}

export function decryptApiKey(encryptedApiKey: string): string {
  try {
    console.log(JSON.stringify({
      level: 'debug',
      message: 'Attempting to decrypt API key',
      encryptedLength: encryptedApiKey?.length || 0,
      encryptedPreview: encryptedApiKey?.substring(0, 20) || 'empty',
      timestamp: new Date().toISOString()
    }));

    if (!encryptedApiKey || encryptedApiKey.trim() === '') {
      throw new Error('Encrypted API key is empty or undefined');
    }

    const token = getFernetToken();
    const decrypted = token.decode(encryptedApiKey);

    if (!decrypted || decrypted.trim() === '') {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Decryption resulted in empty string',
        possibleCause: 'Wrong encryption key or corrupted data',
        encryptedPreview: encryptedApiKey.substring(0, 20),
        timestamp: new Date().toISOString()
      }));
      throw new Error('Decryption failed: resulted in empty string. This usually means the API_KEY_ENCRYPTION_KEY is incorrect or the data was encrypted with a different key.');
    }

    console.log(JSON.stringify({
      level: 'debug',
      message: 'API key decrypted successfully',
      decryptedLength: decrypted.length,
      timestamp: new Date().toISOString()
    }));

    return decrypted;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to decrypt API key',
      error: error instanceof Error ? error.message : String(error),
      encryptedPreview: encryptedApiKey?.substring(0, 20) || 'empty',
      timestamp: new Date().toISOString()
    }));
    throw error;
  }
}
