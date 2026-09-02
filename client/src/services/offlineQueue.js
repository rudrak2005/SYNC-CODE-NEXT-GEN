const QUEUE_KEY =
  "synccode-offline-queue";


const loadQueue = () => {

  try {

    const raw =
      localStorage.getItem(
        QUEUE_KEY
      );


    if (!raw) {
      return [];
    }


    const parsed =
      JSON.parse(raw);


    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "Offline queue load failed:",
      error
    );

    return [];
  }
};


const saveQueue = (
  queue
) => {

  try {

    localStorage.setItem(
      QUEUE_KEY,
      JSON.stringify(queue)
    );

  } catch (error) {

    console.error(
      "Offline queue save failed:",
      error
    );
  }
};


/*
 * Add event to queue.
 *
 * Code changes for the same file
 * are compressed so we don't store
 * hundreds of keystrokes.
 */

export const enqueue = (
  eventName,
  payload
) => {

  const queue =
    loadQueue();


  /*
   * For code changes:
   * keep only latest code for
   * the same room + file.
   */

  if (
    eventName ===
    "code:change"
  ) {

    const {
      roomId,
      fileName
    } = payload;


    const existingIndex =
      queue.findIndex(
        (item) =>
          item.eventName ===
            "code:change" &&
          item.payload?.roomId ===
            roomId &&
          item.payload?.fileName ===
            fileName
      );


    if (
      existingIndex !== -1
    ) {

      queue[
        existingIndex
      ] = {

        eventName,

        payload: {
          ...payload
        },

        queuedAt:
          Date.now()
      };


      saveQueue(queue);

      return;
    }
  }


  /*
   * File operations are kept
   * separately.
   */

  queue.push({

    eventName,

    payload,

    queuedAt:
      Date.now()
  });


  saveQueue(queue);
};


export const getQueue = () => {
  return loadQueue();
};


export const getQueueLength = () => {
  return loadQueue().length;
};


export const clearQueue = () => {

  localStorage.removeItem(
    QUEUE_KEY
  );
};


export const flushQueue = (
  socket
) => {

  if (
    !socket ||
    !socket.connected
  ) {
    return 0;
  }


  const queue =
    loadQueue();


  if (
    queue.length === 0
  ) {
    return 0;
  }


  let sent = 0;


  queue.forEach(
    (item) => {

      try {

        socket.emit(
          item.eventName,
          item.payload
        );

        sent++;

      } catch (error) {

        console.error(
          "Queued event failed:",
          error
        );
      }
    }
  );


  /*
   * Clear only after
   * sending the complete batch.
   */

  clearQueue();


  return sent;
};