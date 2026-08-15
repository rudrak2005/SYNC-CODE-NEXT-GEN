const Room = require("../models/Room");
const {
  generateRoomId
} = require("../services/roomService");

const createRoom = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Room name is required"
      });
    }

    const roomName = name.trim();

    if (roomName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Room name must contain at least 2 characters"
      });
    }

    let roomId;
    let existingRoom;

    do {
      roomId = generateRoomId();

      existingRoom = await Room.findOne({
        roomId
      });
    } while (existingRoom);

    const room = await Room.create({
      roomId,
      name: roomName,

      ownerId: req.user._id,

      participants: [
        {
          userId: req.user._id,
          role: "owner"
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",

      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        ownerId: room.ownerId,
        participants: room.participants,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const joinRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required"
      });
    }

    const room = await Room.findOne({
      roomId: roomId.toUpperCase()
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    const alreadyParticipant = room.participants.some(
      (participant) =>
        participant.userId.toString() ===
        req.user._id.toString()
    );

    if (alreadyParticipant) {
      return res.status(200).json({
        success: true,
        message: "Already joined this room",
        room
      });
    }

    room.participants.push({
      userId: req.user._id,
      role: "editor"
    });

    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room joined successfully",
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        ownerId: room.ownerId,
        participants: room.participants
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  joinRoom
};