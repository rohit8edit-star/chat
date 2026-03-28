import nacl from "tweetnacl";
import util from "tweetnacl-util";

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

// Generate a new key pair for a user
export const generateKeyPair = (): KeyPair => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: util.encodeBase64(keyPair.publicKey),
    secretKey: util.encodeBase64(keyPair.secretKey),
  };
};

// Encrypt a message
export const encryptMessage = (
  text: string,
  theirPublicKeyBase64: string,
  mySecretKeyBase64: string,
): string => {
  try {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = util.decodeUTF8(text);
    const theirPublicKeyUint8 = util.decodeBase64(theirPublicKeyBase64);
    const mySecretKeyUint8 = util.decodeBase64(mySecretKeyBase64);

    const encrypted = nacl.box(
      messageUint8,
      nonce,
      theirPublicKeyUint8,
      mySecretKeyUint8,
    );

    // Combine nonce and encrypted message into a single Uint8Array
    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    return util.encodeBase64(fullMessage);
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Fallback to plain text if encryption fails (for backward compatibility)
  }
};

// Decrypt a message
export const decryptMessage = (
  encryptedBase64: string,
  theirPublicKeyBase64: string,
  mySecretKeyBase64: string,
): string => {
  try {
    const fullMessageUint8 = util.decodeBase64(encryptedBase64);
    const nonce = fullMessageUint8.slice(0, nacl.box.nonceLength);
    const message = fullMessageUint8.slice(nacl.box.nonceLength);

    const theirPublicKeyUint8 = util.decodeBase64(theirPublicKeyBase64);
    const mySecretKeyUint8 = util.decodeBase64(mySecretKeyBase64);

    const decrypted = nacl.box.open(
      message,
      nonce,
      theirPublicKeyUint8,
      mySecretKeyUint8,
    );

    if (!decrypted) {
      throw new Error("Could not decrypt message");
    }

    return util.encodeUTF8(decrypted);
  } catch (error) {
    // If decryption fails, it might be an old unencrypted message
    return encryptedBase64;
  }
};

// Manage keys in local storage
export const getLocalKeys = (userId: string): KeyPair | null => {
  const keys = localStorage.getItem(`e2ee_keys_${userId}`);
  return keys ? JSON.parse(keys) : null;
};

export const saveLocalKeys = (userId: string, keys: KeyPair) => {
  localStorage.setItem(`e2ee_keys_${userId}`, JSON.stringify(keys));
};
