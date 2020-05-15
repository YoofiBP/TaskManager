const mongoose = require("mongoose");
//const validator = require("validator");

const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    description: {
      type: String,
      trim: true,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = taskSchema;
