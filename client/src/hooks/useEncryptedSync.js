import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  encryptMessage,
  decryptMessage
} from "../services/e2eeService";


function useEncryptedSync(
  socket,
  roomId,
  user,
  roomSecret
) {

  const [
    encryptionEnabled,
    setEncryptionEnabled
  ] = useState(false);


  const [
    encryptedPeerUpdates,
    setEncryptedPeerUpdates
  ] = useState([]);


  const enableEncryption = useCallback(
    (secret) => {

      if (
        !secret ||
        secret.length < 6
      ) {

        throw new Error(
          "Room secret must be at least 6 characters."
        );
      }


      setEncryptionEnabled(
        true
      );
    },
    []
  );


  const disableEncryption =
    useCallback(() => {

      setEncryptionEnabled(
        false
      );

    }, []);


  /*
   * Send encrypted code
   */

  const sendEncryptedCode =
    useCallback(
      async (
        fileName,
        code
      ) => {

        if (
          !socket ||
          !roomId ||
          !roomSecret ||
          !encryptionEnabled
        ) {
          return false;
        }


        try {

          const encrypted =
            await encryptMessage(
              {
                type: "code",

                roomId,

                fileName,

                code,

                senderId:
                  user?.id,

                timestamp:
                  Date.now()
              },

              roomSecret,

              roomId
            );


          socket.emit(
            "e2ee:code",
            {
              roomId,
              payload: encrypted
            }
          );


          return true;

        } catch (error) {

          console.error(
            "E2EE encryption failed:",
            error
          );

          return false;
        }
      },

      [
        socket,
        roomId,
        roomSecret,
        encryptionEnabled,
        user
      ]
    );


  /*
   * Receive encrypted code
   */

  useEffect(() => {

    if (
      !socket ||
      !roomId ||
      !roomSecret ||
      !encryptionEnabled
    ) {
      return;
    }


    const handleEncryptedCode =
      async ({
        payload
      }) => {

        try {

          const message =
            await decryptMessage(
              payload,

              roomSecret,

              roomId
            );


          if (
            message.roomId !== roomId
          ) {
            return;
          }


          if (
            message.type !== "code"
          ) {
            return;
          }


          setEncryptedPeerUpdates(
            (previous) => [
              ...previous,

              message
            ]
          );

        } catch (error) {

          console.error(
            "E2EE decryption failed:",
            error.message
          );
        }
      };


    socket.on(
      "e2ee:code",
      handleEncryptedCode
    );


    return () => {

      socket.off(
        "e2ee:code",
        handleEncryptedCode
      );

    };

  }, [
    socket,
    roomId,
    roomSecret,
    encryptionEnabled
  ]);


  return {
    encryptionEnabled,

    enableEncryption,

    disableEncryption,

    sendEncryptedCode,

    encryptedPeerUpdates
  };
}

export default useEncryptedSync;