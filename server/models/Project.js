const mongoose = require("mongoose");


const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    language: {
      type: String,
      default: "plaintext"
    },

    content: {
      type: String,
      default: ""
    }
  },
  {
    _id: false
  }
);


const projectSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    files: {
      type: [fileSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);


module.exports =
  mongoose.model(
    "Project",
    projectSchema
  );