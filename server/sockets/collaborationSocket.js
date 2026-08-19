const roomUsers = new Map();

const {
  saveFile,
  deleteFile,
  renameFile,
  updateFileContent
} = require("../services/projectService");


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
            socketId:
              socket.id,

            userId:
              user?.id,

            name:
              user?.name ||
              "Anonymous"
          }
        );


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
      async ({
        roomId,
        fileName,
        code
      }) => {

        if (
          !roomId ||
          !fileName
        ) {
          return;
        }


        const normalizedRoomId =
          roomId.toUpperCase();


        /*
         * Send live update first.
         */

        socket
          .to(normalizedRoomId)
          .emit(
            "code:update",
            {
              fileName,
              code
            }
          );


        /*
         * Save code to MongoDB.
         */

        try {

          await updateFileContent(
            normalizedRoomId,
            fileName,
            code
          );

        } catch (error) {

          console.error(
            "Code persistence error:",
            error.message
          );
        }
      }
    );


    /*
     * ========================================
     * FILE CREATE
     * ========================================
     */

    socket.on(
      "file:create",
      async ({
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


        try {

          /*
           * Save file to MongoDB.
           */

          await saveFile(
            normalizedRoomId,
            file
          );


          /*
           * Send to other users.
           */

          socket
            .to(normalizedRoomId)
            .emit(
              "file:created",
              {
                file
              }
            );


          console.log(
            `File created and saved: ${file.name} in ${normalizedRoomId}`
          );

        } catch (error) {

          console.error(
            "File create persistence error:",
            error.message
          );
        }
      }
    );


    /*
     * ========================================
     * FILE DELETE
     * ========================================
     */

    socket.on(
      "file:delete",
      async ({
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


        try {

          /*
           * Delete from MongoDB.
           */

          await deleteFile(
            normalizedRoomId,
            fileName
          );


          /*
           * Send delete event
           * to other users.
           */

          socket
            .to(normalizedRoomId)
            .emit(
              "file:deleted",
              {
                fileName
              }
            );


          console.log(
            `File deleted and saved: ${fileName} in ${normalizedRoomId}`
          );

        } catch (error) {

          console.error(
            "File delete persistence error:",
            error.message
          );
        }
      }
    );


    /*
     * ========================================
     * FILE RENAME
     * ========================================
     */

    socket.on(
      "file:rename",
      async ({
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


        try {

          /*
           * Rename in MongoDB.
           */

          await renameFile(
            normalizedRoomId,
            oldFileName,
            newFile
          );


          /*
           * Send rename event
           * to other users.
           */

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
            `File renamed and saved: ${oldFileName} -> ${newFile.name} in ${normalizedRoomId}`
          );

        } catch (error) {

          console.error(
            "File rename persistence error:",
            error.message
          );
        }
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
    roomUsers.get(
      roomId
    );


  if (!users) {
    return;
  }


  users.delete(
    socket.id
  );


  /*
   * Notify other users.
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
   * Update user list.
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
   * Delete empty room.
   */

  if (
    users.size === 0
  ) {

    roomUsers.delete(
      roomId
    );
  }


  socket.leave(
    roomId
  );


  /*
   * Prevent duplicate cleanup.
   */

  socket.roomId =
    null;
};


module.exports =
  initializeCollaboration;