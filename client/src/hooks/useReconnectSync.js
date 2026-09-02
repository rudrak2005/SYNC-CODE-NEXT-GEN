import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  enqueue,
  flushQueue,
  getQueueLength
} from "../services/offlineQueue";


function useReconnectSync(
  socket,
  roomId,
  user
) {

  const [
    connectionStatus,
    setConnectionStatus
  ] = useState(
    socket?.connected
      ? "connected"
      : "disconnected"
  );


  const [
    queuedChanges,
    setQueuedChanges
  ] = useState(
    getQueueLength()
  );


  const [
    reconnecting,
    setReconnecting
  ] = useState(false);


  const updateQueueCount =
    useCallback(() => {

      setQueuedChanges(
        getQueueLength()
      );

    }, []);


  const sendOrQueue =
    useCallback(
      (
        eventName,
        payload
      ) => {

        if (
          socket?.connected
        ) {

          socket.emit(
            eventName,
            payload
          );

          return true;
        }


        /*
         * Socket offline.
         */

        enqueue(
          eventName,
          payload
        );


        updateQueueCount();


        return false;
      },

      [
        socket,
        updateQueueCount
      ]
    );


  useEffect(() => {

    if (
      !socket ||
      !roomId ||
      !user
    ) {
      return;
    }


    const handleConnect =
      () => {

        console.log(
          "✅ Socket reconnected:",
          socket.id
        );


        setConnectionStatus(
          "connected"
        );


        setReconnecting(
          false
        );


        /*
         * Rejoin room after
         * every new connection.
         */

        socket.emit(
          "room:join",
          {
            roomId,

            user: {
              id: user.id,
              name: user.name
            }
          }
        );


        /*
         * Flush offline queue.
         */

        const sent =
          flushQueue(
            socket
          );


        updateQueueCount();


        console.log(
          `✅ Offline queue flushed: ${sent}`
        );
      };


    const handleDisconnect =
      (reason) => {

        console.warn(
          "Socket disconnected:",
          reason
        );


        setConnectionStatus(
          "disconnected"
        );


        setReconnecting(
          true
        );


        updateQueueCount();
      };


    const handleReconnectAttempt =
      (attempt) => {

        console.log(
          `Reconnection attempt ${attempt}`
        );


        setConnectionStatus(
          "reconnecting"
        );
      };


    const handleReconnectError =
      (error) => {

        console.error(
          "Reconnect error:",
          error
        );

        setConnectionStatus(
          "reconnecting"
        );
      };


    const handleReconnectFailed =
      () => {

        console.error(
          "Socket reconnection failed."
        );


        setConnectionStatus(
          "disconnected"
        );
      };


    socket.on(
      "connect",
      handleConnect
    );


    socket.on(
      "disconnect",
      handleDisconnect
    );


    socket.io.on(
      "reconnect_attempt",
      handleReconnectAttempt
    );


    socket.io.on(
      "reconnect_error",
      handleReconnectError
    );


    socket.io.on(
      "reconnect_failed",
      handleReconnectFailed
    );


    /*
     * If socket was already
     * connected when hook mounted.
     */

    if (socket.connected) {

      setConnectionStatus(
        "connected"
      );

    }


    return () => {

      socket.off(
        "connect",
        handleConnect
      );


      socket.off(
        "disconnect",
        handleDisconnect
      );


      socket.io.off(
        "reconnect_attempt",
        handleReconnectAttempt
      );


      socket.io.off(
        "reconnect_error",
        handleReconnectError
      );


      socket.io.off(
        "reconnect_failed",
        handleReconnectFailed
      );
    };

  }, [
    socket,
    roomId,
    user,
    updateQueueCount
  ]);


  return {

    connectionStatus,

    reconnecting,

    queuedChanges,

    sendOrQueue,

    updateQueueCount
  };
}


export default useReconnectSync;