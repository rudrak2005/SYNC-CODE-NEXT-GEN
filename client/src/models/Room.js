const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    role: {
      type: String,
      enum: ["owner", "editor", "viewer"],
      default: "editor"
    },

    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    participants: {
      type: [participantSchema],
      default: []
    },

    permissions: {
      allowViewerJoin: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Room", roomSchema);