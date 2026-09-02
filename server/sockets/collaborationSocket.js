const roomUsers = new Map();

const {
  saveFile,
  deleteFile,
  renameFile,
  updateFileContent
} = require("../services/projectService");

const initializeCollaboration = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /*
     * ========================================
     * ROOM JOIN
     * ========================================
     */
    socket.on("room:join", ({ roomId, user }) => {
      if (!roomId) return;

      const normalizedRoomId = roomId.toUpperCase();

      socket.join(normalizedRoomId);
      socket.roomId = normalizedRoomId;
      socket.user = user;

      if (!roomUsers.has(normalizedRoomId)) {
        roomUsers.set(normalizedRoomId, new Map());
      }

      const users = roomUsers.get(normalizedRoomId);

      users.set(socket.id, {
        socketId: socket.id,
        userId: user?.id,
        name: user?.name || "Anonymous"
      });

      socket.to(normalizedRoomId).emit("user:joined", {
        user: users.get(socket.id)
      });
      socket
  .to(normalizedRoomId)
  .emit(
    "webrtc:peer-joined",
    {
      socketId: socket.id
    }
  );

      io.to(normalizedRoomId).emit("room:users", {
        users: Array.from(users.values())
      });

      console.log(`${socket.id} joined ${normalizedRoomId}`);
    });

    

    /*
     * ========================================
     * CODE CHANGE (ONLY ONE LISTENER)
     * ========================================
     */
    socket.on("code:change", async ({ roomId, fileName, code }) => {
      if (!roomId || !fileName) return;

      const normalizedRoomId = roomId.toUpperCase();

      try {
        const project = await updateFileContent(
          normalizedRoomId,
          fileName,
          code
        );

        socket.to(normalizedRoomId).emit("code:update", {
          fileName,
          code,
          revision: project?.revision || 0
        });

        socket.emit("revision:update", {
          revision: project?.revision || 0
        });

        console.log(
          `Code updated: ${fileName} | Revision ${project?.revision || 0}`
        );
      } catch (error) {
        console.error("Code update failed:", error.message);
      }
    });
    /*
 * ========================================
 * E2EE CODE RELAY
 * ========================================
 */

socket.on(
  "e2ee:code",
  ({
    roomId,
    payload
  }) => {

    if (
      !roomId ||
      !payload
    ) {
      return;
    }


    const normalizedRoomId =
      roomId.toUpperCase();


    /*
     * IMPORTANT:
     * Server does not decrypt.
     */

    socket
      .to(normalizedRoomId)
      .emit(
        "e2ee:code",
        {
          payload
        }
      );


    console.log(
      `Encrypted code relayed in ${normalizedRoomId}`
    );
  }
);

    /*
     * ========================================
     * FILE CREATE
     * ========================================
     */
    socket.on("file:create", async ({ roomId, file }) => {
      if (!roomId || !file?.name) return;

      const normalizedRoomId = roomId.toUpperCase();

      try {
        const project = await saveFile(normalizedRoomId, file);

        socket.to(normalizedRoomId).emit("file:created", {
          file,
          revision: project?.revision || 0
        });

        socket.emit("revision:update", {
          revision: project?.revision || 0
        });

        console.log(`File created: ${file.name}`);
      } catch (error) {
        console.error("File create failed:", error.message);
      }
    });

    /*
     * ========================================
     * FILE DELETE
     * ========================================
     */
    socket.on("file:delete", async ({ roomId, fileName }) => {
      if (!roomId || !fileName) return;

      const normalizedRoomId = roomId.toUpperCase();

      try {
        const project = await deleteFile(normalizedRoomId, fileName);

        socket.to(normalizedRoomId).emit("file:deleted", {
          fileName,
          revision: project?.revision || 0
        });

        socket.emit("revision:update", {
          revision: project?.revision || 0
        });

        console.log(`File deleted: ${fileName}`);
      } catch (error) {
        console.error("File delete failed:", error.message);
      }
    });

    /*
     * ========================================
     * FILE RENAME
     * ========================================
     */
    socket.on(
      "file:rename",
      async ({ roomId, oldFileName, newFile }) => {
        if (!roomId || !oldFileName || !newFile?.name) return;

        const normalizedRoomId = roomId.toUpperCase();

        try {
          const project = await renameFile(
            normalizedRoomId,
            oldFileName,
            newFile
          );

          socket.to(normalizedRoomId).emit("file:renamed", {
            oldFileName,
            newFile,
            revision: project?.revision || 0
          });

          socket.emit("revision:update", {
            revision: project?.revision || 0
          });

          console.log(`File renamed: ${oldFileName} → ${newFile.name}`);
        } catch (error) {
          console.error("File rename failed:", error.message);
        }
      }
    );

/*
 * ========================================
 * PROJECT RESTORE
 * ========================================
 */

socket.on(
  "project:restore",
  ({
    roomId,
    files,
    revision
  }) => {

    if (
      !roomId ||
      !files
    ) {
      return;
    }

    const normalizedRoomId =
      roomId.toUpperCase();

    socket
      .to(normalizedRoomId)
      .emit(
        "project:restored",
        {
          files,
          revision
        }
      );

    console.log(
      `Project restored in ${normalizedRoomId}`
    );
  }
);



    /*
     * ========================================
     * CURSOR MOVE
     * ========================================
     */
    socket.on("cursor:move", (cursor) => {
      if (!socket.roomId) return;

      socket.to(socket.roomId).emit("cursor:update", cursor);
    });
	socket.on(
  "terminal:output",
  ({ roomId, output }) => {

    socket
      .to(roomId.toUpperCase())
      .emit(
        "terminal:update",
        { output }
      );

  }
);

    /*
     * ========================================
     * ROOM LEAVE
     * ========================================
     */
    /*
 * ========================================
 * WEBRTC OFFER
 * ========================================
 */

socket.on(
  "webrtc:offer",
  ({
    target,
    offer
  }) => {

    if (
      !target ||
      !offer
    ) {
      return;
    }

    io.to(target).emit(
      "webrtc:offer",
      {
        from: socket.id,
        offer
      }
    );
  }
);


/*
 * ========================================
 * WEBRTC ANSWER
 * ========================================
 */

socket.on(
  "webrtc:answer",
  ({
    target,
    answer
  }) => {

    if (
      !target ||
      !answer
    ) {
      return;
    }

    io.to(target).emit(
      "webrtc:answer",
      {
        from: socket.id,
        answer
      }
    );
  }
);


/*
 * ========================================
 * WEBRTC ICE CANDIDATE
 * ========================================
 */

socket.on(
  "webrtc:ice-candidate",
  ({
    target,
    candidate
  }) => {

    if (
      !target ||
      !candidate
    ) {
      return;
    }

    io.to(target).emit(
      "webrtc:ice-candidate",
      {
        from: socket.id,
        candidate
      }
    );
  }
);


/*
 * ========================================
 * PEER JOIN NOTIFICATION
 * ========================================
 */

socket.on(
  "room:join",
  ({ roomId }) => {
    /*
     * Existing room:users logic
     * already handles presence.

     * This separate notification
     * will be emitted below from
     * the existing room join block.
     */
  }
);




    socket.on("room:leave", () => {
      handleDisconnect(socket, io);
    });

    /*
     * ========================================
     * DISCONNECT
     * ========================================
     */
    socket.on("disconnect", () => {
      handleDisconnect(socket, io);
    });
  });
};

/*
 * ========================================
 * DISCONNECT HANDLER
 * ========================================
 */
const handleDisconnect = (socket, io) => {
  const roomId = socket.roomId;

  if (!roomId) return;

  const users = roomUsers.get(roomId);

  if (!users) return;

  users.delete(socket.id);

  socket.to(roomId).emit("user:left", {
    socketId: socket.id,
    user: socket.user
  });

  io.to(roomId).emit("room:users", {
    users: Array.from(users.values())
  });

  if (users.size === 0) {
    roomUsers.delete(roomId);
  }

  socket.leave(roomId);
  socket.roomId = null;
};

module.exports = initializeCollaboration;