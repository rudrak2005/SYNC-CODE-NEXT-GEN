const roomUsers = new Map();


const initializeCollaboration = (io) => {

  io.on("connection", (socket) => {

    console.log(
      `Socket connected: ${socket.id}`
    );


    /*
     * ========================================
     * ROOM JOIN
     * ========================================
     */

    socket.on(
      "room:join",
      ({ roomId, user }) => {

        if (!roomId) {
          return;
        }


        const normalizedRoomId =
          roomId.toUpperCase();


        socket.join(
          normalizedRoomId
        );


        socket.roomId =
          normalizedRoomId;

        socket.user =
          user;


        if (
          !roomUsers.has(
            normalizedRoomId
          )
        ) {

          roomUsers.set(
            normalizedRoomId,
            new Map()
          );
        }


        const users =
          roomUsers.get(
            normalizedRoomId
          );


        users.set(
          socket.id,
          {
            socketId: socket.id,

            userId:
              user?.id,

            name:
              user?.name ||
              "Anonymous"
          }
        );


        /*
         * Notify other users
         */

        socket
          .to(normalizedRoomId)
          .emit(
            "user:joined",
            {
              user:
                users.get(
                  socket.id
                )
            }
          );


        /*
         * Send complete user list
         */

        io
          .to(normalizedRoomId)
          .emit(
            "room:users",
            {
              users:
                Array.from(
                  users.values()
                )
            }
          );


        console.log(
          `${socket.id} joined ${normalizedRoomId}`
        );
      }
    );


    /*
     * ========================================
     * CODE CHANGE
     * ========================================
     */

    socket.on(
      "code:change",
      ({
        roomId,
        fileName,
        code
      }) => {

        if (!roomId) {
          return;
        }


        const normalizedRoomId =
          roomId.toUpperCase();


        socket
          .to(normalizedRoomId)
          .emit(
            "code:update",
            {
              fileName,
              code
            }
          );
      }
    );


    /*
     * ========================================
     * FILE CREATE
     * ========================================
     */

    socket.on(
      "file:create",
      ({
        roomId,
        file
      }) => {

        if (
          !roomId ||
          !file?.name
        ) {
          return;
        }


        const normalizedRoomId =
          roomId.toUpperCase();


        socket
          .to(normalizedRoomId)
          .emit(
            "file:created",
            {
              file
            }
          );


        console.log(
          `File created: ${file.name} in ${normalizedRoomId}`
        );
      }
    );


    /*
     * ========================================
     * FILE DELETE
     * ========================================
     */

    socket.on(
      "file:delete",
      ({
        roomId,
        fileName
      }) => {

        if (
          !roomId ||
          !fileName
        ) {
          return;
        }


        const normalizedRoomId =
          roomId.toUpperCase();


        socket
          .to(normalizedRoomId)
          .emit(
            "file:deleted",
            {
              fileName
            }
          );


        console.log(
          `File deleted: ${fileName} in ${normalizedRoomId}`
        );
      }
    );


    /*
     * ========================================
     * FILE RENAME
     * ========================================
     */

    socket.on(
      "file:rename",
      ({
        roomId,
        oldFileName,
        newFile
      }) => {

        if (
          !roomId ||
          !oldFileName ||
          !newFile?.name
        ) {
          return;
        }


        const normalizedRoomId =
          roomId.toUpperCase();


        socket
          .to(normalizedRoomId)
          .emit(
            "file:renamed",
            {
              oldFileName,
              newFile
            }
          );


        console.log(
          `File renamed: ${oldFileName} -> ${newFile.name} in ${normalizedRoomId}`
        );
      }
    );


    /*
     * ========================================
     * CURSOR MOVE
     * ========================================
     */

    socket.on(
      "cursor:move",
      (cursor) => {

        if (!socket.roomId) {
          return;
        }


        socket
          .to(socket.roomId)
          .emit(
            "cursor:update",
            cursor
          );
      }
    );


    /*
     * ========================================
     * ROOM LEAVE
     * ========================================
     */

    socket.on(
      "room:leave",
      () => {

        handleDisconnect(
          socket,
          io
        );
      }
    );


    /*
     * ========================================
     * DISCONNECT
     * ========================================
     */

    socket.on(
      "disconnect",
      () => {

        handleDisconnect(
          socket,
          io
        );
      }
    );

  });
};


/*
 * ========================================
 * DISCONNECT HANDLER
 * ========================================
 */

const handleDisconnect = (
  socket,
  io
) => {

  const roomId =
    socket.roomId;


  if (!roomId) {
    return;
  }


  const users =
    roomUsers.get(roomId);


  if (!users) {
    return;
  }


  users.delete(
    socket.id
  );


  /*
   * Notify other users
   */

  socket
    .to(roomId)
    .emit(
      "user:left",
      {
        socketId:
          socket.id,

        user:
          socket.user
      }
    );


  /*
   * Update user list
   */

  io
    .to(roomId)
    .emit(
      "room:users",
      {
        users:
          Array.from(
            users.values()
          )
      }
    );


  /*
   * Delete empty room
   */

  if (users.size === 0) {

    roomUsers.delete(
      roomId
    );
  }


  socket.leave(
    roomId
  );


  /*
   * Clear socket room
   * so duplicate cleanup
   * doesn't happen.
   */

  socket.roomId =
    null;
};


module.exports =
  initializeCollaboration;