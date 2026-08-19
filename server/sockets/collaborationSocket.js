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


        try {

          /*
           * Save code to MongoDB.
           */

          const project =
            await updateFileContent(
              normalizedRoomId,
              fileName,
              code
            );


          /*
           * Send live update
           * to other users.
           */

          socket
            .to(normalizedRoomId)
            .emit(
              "code:update",
              {
                fileName,
                code,
                revision:
                  project?.revision
              }
            );


          console.log(
            `Code updated: ${fileName} | revision: ${
              project?.revision ?? "N/A"
            }`
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

          const project =
            await saveFile(
              normalizedRoomId,
              file
            );


          socket
            .to(normalizedRoomId)
            .emit(
              "file:created",
              {
                file,

                revision:
                  project?.revision
              }
            );


          console.log(
            `File created: ${file.name} | revision: ${
              project?.revision ?? "N/A"
            }`
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

          const project =
            await deleteFile(
              normalizedRoomId,
              fileName
            );


          socket
            .to(normalizedRoomId)
            .emit(
              "file:deleted",
              {
                fileName,

                revision:
                  project?.revision
              }
            );


          console.log(
            `File deleted: ${fileName} | revision: ${
              project?.revision ?? "N/A"
            }`
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

          const project =
            await renameFile(
              normalizedRoomId,
              oldFileName,
              newFile
            );


          socket
            .to(normalizedRoomId)
            .emit(
              "file:renamed",
              {
                oldFileName,
                newFile,

                revision:
                  project?.revision
              }
            );


          console.log(
            `File renamed: ${oldFileName} -> ${newFile.name} | revision: ${
              project?.revision ?? "N/A"
            }`
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


  socket.roomId =
    null;
};


module.exports =
  initializeCollaboration;