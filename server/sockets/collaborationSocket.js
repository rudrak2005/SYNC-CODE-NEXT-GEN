const roomUsers = new Map();

const initializeCollaboration = (io) => {
  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id}`
    );

    // =========================
    // ROOM JOIN
    // =========================
    socket.on("room:join", ({ roomId, user }) => {
      if (!roomId) {
        return;
      }

      const normalizedRoomId =
        roomId.toUpperCase();

      socket.join(normalizedRoomId);

      socket.roomId = normalizedRoomId;
      socket.user = user;

      if (!roomUsers.has(normalizedRoomId)) {
        roomUsers.set(
          normalizedRoomId,
          new Map()
        );
      }

      const users =
        roomUsers.get(normalizedRoomId);

      users.set(socket.id, {
        socketId: socket.id,
        userId: user?.id,
        name: user?.name || "Anonymous"
      });

      socket.to(normalizedRoomId).emit(
        "user:joined",
        {
          user: users.get(socket.id)
        }
      );

      io.to(normalizedRoomId).emit(
        "room:users",
        {
          users: Array.from(users.values())
        }
      );

      console.log(
        `${socket.id} joined ${normalizedRoomId}`
      );
    });


    // =========================
    // CODE CHANGE
    // =========================
    socket.on(
      "code:change",
      ({ roomId, fileName, code }) => {
        if (!roomId) {
          return;
        }

        const normalizedRoomId =
          roomId.toUpperCase();

        socket.to(normalizedRoomId).emit(
          "code:update",
          {
            fileName,
            code
          }
        );
      }
    );


    // =========================
    // CURSOR MOVE
    // =========================
    socket.on(
      "cursor:move",
      (cursor) => {

        const roomId =
          socket.roomId;

        if (!roomId) {
          return;
        }

        console.log(
          "CURSOR RECEIVED:",
          cursor
        );

        socket.to(roomId).emit(
          "cursor:update",
          cursor
        );
      }
    );


    // =========================
    // ROOM LEAVE
    // =========================
    socket.on("room:leave", () => {
      handleDisconnect(socket, io);
    });


    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", () => {
      handleDisconnect(socket, io);
    });
  });
};


// =================================
// HANDLE DISCONNECT
// =================================
const handleDisconnect = (socket, io) => {

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

  users.delete(socket.id);

  socket.to(roomId).emit(
    "user:left",
    {
      socketId: socket.id,
      user: socket.user
    }
  );

  io.to(roomId).emit(
    "room:users",
    {
      users: Array.from(
        users.values()
      )
    }
  );

  if (users.size === 0) {
    roomUsers.delete(roomId);
  }

  socket.leave(roomId);
};


module.exports = initializeCollaboration;