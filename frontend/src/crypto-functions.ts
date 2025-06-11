/**
 * RSA Encryption/Decryption Utilities
 * Includes: 
 * - Key pair generation
 * - Public/private key export/import
 * - Message encryption/decryption
 */

// ======================== Core Functions ========================

/**
 * Generates RSA-OAEP key pair (public/private)
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports public key as base64 string
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Exports private key as base64 string
 */
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Imports public key from base64 string
 */
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const binaryKey = base64ToArrayBuffer(base64Key);
  return await crypto.subtle.importKey(
    "spki",
    binaryKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

/**
 * Imports private key from base64 string
 */
export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  const binaryKey = base64ToArrayBuffer(base64Key);
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

/**
 * Encrypts data with public key
 */
export async function encryptWithPublicKey(data: string, publicKey: CryptoKey): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encoded
  );
  return arrayBufferToBase64(encrypted);
}

/**
 * Decrypts data with private key
 */
export async function decryptWithPrivateKey(encryptedData: string, privateKey: CryptoKey): Promise<string> {
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBuffer
  );
  return new TextDecoder().decode(decrypted);
}

// ======================== Helper Functions ========================

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}