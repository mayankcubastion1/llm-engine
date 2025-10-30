import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY) {
  console.error(JSON.stringify({
    level: 'error',
    message: 'ENCRYPTION_KEY environment variable is required',
    timestamp: new Date().toISOString()
  }));
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

export function encryptApiKey(apiKey: string): string {
  try {
    console.log(JSON.stringify({
      level: 'debug',
      message: 'Encrypting API key',
      keyLength: apiKey.length,
      timestamp: new Date().toISOString()
    }));

    const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();

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

    const bytes = CryptoJS.AES.decrypt(encryptedApiKey, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted || decrypted.trim() === '') {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Decryption resulted in empty string',
        possibleCause: 'Wrong encryption key or corrupted data',
        encryptedPreview: encryptedApiKey.substring(0, 20),
        timestamp: new Date().toISOString()
      }));
      throw new Error('Decryption failed: resulted in empty string. This usually means the ENCRYPTION_KEY is incorrect or the data was encrypted with a different key.');
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
