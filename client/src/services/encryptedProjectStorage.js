import {
  encryptData,
  decryptData
} from "./cryptoService";


const getStorageKey = (
  roomId
) => {

  return `synccode-encrypted-${roomId}`;
};


/*
 * Save encrypted project locally
 */
export const saveEncryptedProject =
  async (
    roomId,
    files,
    password
  ) => {

    if (!roomId) {
      throw new Error(
        "Room ID is required."
      );
    }


    if (!password) {
      throw new Error(
        "Encryption password is required."
      );
    }


    const encrypted =
      await encryptData(
        {
          roomId,

          files,

          savedAt:
            new Date().toISOString()
        },

        password
      );


    localStorage.setItem(
      getStorageKey(
        roomId
      ),

      JSON.stringify(
        encrypted
      )
    );


    return encrypted;
  };


/*
 * Load encrypted project
 */
export const loadEncryptedProject =
  async (
    roomId,
    password
  ) => {

    const raw =
      localStorage.getItem(
        getStorageKey(
          roomId
        )
      );


    if (!raw) {
      return null;
    }


    const encrypted =
      JSON.parse(raw);


    return decryptData(
      encrypted,
      password
    );
  };


/*
 * Check whether encrypted
 * backup exists
 */
export const hasEncryptedProject =
  (roomId) => {

    return Boolean(
      localStorage.getItem(
        getStorageKey(
          roomId
        )
      )
    );
  };


/*
 * Delete encrypted backup
 */
export const deleteEncryptedProject =
  (roomId) => {

    localStorage.removeItem(
      getStorageKey(
        roomId
      )
    );
  };