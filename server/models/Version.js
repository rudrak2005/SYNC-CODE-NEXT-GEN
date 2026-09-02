const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      uppercase: true
    },

    revision: {
      type: Number,
      required: true
    },

    author: {
      id: String,
      name: String
    },

    files: [
      {
        name: String,
        language: String,
        content: String
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Version",
  versionSchema
);