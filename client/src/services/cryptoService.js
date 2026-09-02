const encoder =
  new TextEncoder();

const decoder =
  new TextDecoder();

const ITERATIONS = 100000;

const KEY_LENGTH = 256;


/*
 * Convert Uint8Array → Base64
 */
const uint8ToBase64 = (
  bytes
) => {

  let binary = "";

  bytes.forEach(
    (byte) => {
      binary += String.fromCharCode(
        byte
      );
    }
  );

  return btoa(binary);
};


/*
 * Convert Base64 → Uint8Array
 */
const base64ToUint8 = (
  base64
) => {

  const binary =
    atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
};


/*
 * Generate random bytes
 */
const createRandomBytes = (
  length
) => {

  const bytes =
    new Uint8Array(
      length
    );

  crypto.getRandomValues(
    bytes
  );

  return bytes;
};


/*
 * Derive AES-GCM key from password
 */
const deriveKey = async (
  password,
  salt
) => {

  const passwordKey =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(
        password
      ),
      "PBKDF2",
      false,
      [
        "deriveKey"
      ]
    );


  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",

      salt,

      iterations:
        ITERATIONS,

      hash: "SHA-256"
    },

    passwordKey,

    {
      name: "AES-GCM",

      length:
        KEY_LENGTH
    },

    false,

    [
      "encrypt",
      "decrypt"
    ]
  );
};


/*
 * Encrypt plain object/string
 */
export const encryptData = async (
  data,
  password
) => {

  if (!password) {
    throw new Error(
      "Encryption password is required."
    );
  }


  const salt =
    createRandomBytes(
      16
    );


  const iv =
    createRandomBytes(
      12
    );


  const key =
    await deriveKey(
      password,
      salt
    );


  const plainText =
    typeof data === "string"
      ? data
      : JSON.stringify(data);


  const encrypted =
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      encoder.encode(
        plainText
      )
    );


  return {
    version: 1,

    algorithm:
      "AES-GCM",

    kdf:
      "PBKDF2-SHA256",

    iterations:
      ITERATIONS,

    salt:
      uint8ToBase64(
        salt
      ),

    iv:
      uint8ToBase64(
        iv
      ),

    data:
      uint8ToBase64(
        new Uint8Array(
          encrypted
        )
      )
  };
};


/*
 * Decrypt encrypted object
 */
export const decryptData = async (
  encryptedPackage,
  password
) => {

  if (
    !encryptedPackage ||
    !password
  ) {

    throw new Error(
      "Encrypted data and password are required."
    );
  }


  const salt =
    base64ToUint8(
      encryptedPackage.salt
    );


  const iv =
    base64ToUint8(
      encryptedPackage.iv
    );


  const encryptedBytes =
    base64ToUint8(
      encryptedPackage.data
    );


  const key =
    await deriveKey(
      password,
      salt
    );


  const decrypted =
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      encryptedBytes
    );


  const plainText =
    decoder.decode(
      decrypted
    );


  try {

    return JSON.parse(
      plainText
    );

  } catch {

    return plainText;
  }
};