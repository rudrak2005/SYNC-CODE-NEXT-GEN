const encoder = new TextEncoder();
const decoder = new TextDecoder();

const ITERATIONS = 100000;


/*
 * ========================================
 * BASE64 HELPERS
 * ========================================
 */

const uint8ToBase64 = (bytes) => {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};


const base64ToUint8 = (base64) => {
  const binary = atob(base64);

  const bytes =
    new Uint8Array(binary.length);

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
 * ========================================
 * ROOM KEY
 * ========================================
 */

const createSalt = () => {
  const salt =
    new TextEncoder()
      .encode("SyncCode-E2EE-v1");

  return salt;
};


const deriveRoomKey = async (
  roomSecret,
  roomId
) => {

  if (!roomSecret) {
    throw new Error(
      "Room secret is required."
    );
  }

  if (!roomId) {
    throw new Error(
      "Room ID is required."
    );
  }


  const passwordKey =
    await crypto.subtle.importKey(
      "raw",

      encoder.encode(
        `${roomSecret}:${roomId}`
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

      salt: createSalt(),

      iterations: ITERATIONS,

      hash: "SHA-256"
    },

    passwordKey,

    {
      name: "AES-GCM",

      length: 256
    },

    false,

    [
      "encrypt",
      "decrypt"
    ]
  );
};


/*
 * ========================================
 * ENCRYPT
 * ========================================
 */

export const encryptMessage = async (
  message,
  roomSecret,
  roomId
) => {

  const key =
    await deriveRoomKey(
      roomSecret,
      roomId
    );


  const iv =
    new Uint8Array(12);

  crypto.getRandomValues(iv);


  const plainText =
    JSON.stringify(message);


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

    algorithm: "AES-GCM",

    iv:
      uint8ToBase64(iv),

    payload:
      uint8ToBase64(
        new Uint8Array(
          encrypted
        )
      )
  };
};


/*
 * ========================================
 * DECRYPT
 * ========================================
 */

export const decryptMessage = async (
  encryptedMessage,
  roomSecret,
  roomId
) => {

  const key =
    await deriveRoomKey(
      roomSecret,
      roomId
    );


  const iv =
    base64ToUint8(
      encryptedMessage.iv
    );


  const encryptedBytes =
    base64ToUint8(
      encryptedMessage.payload
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


  return JSON.parse(
    plainText
  );
};