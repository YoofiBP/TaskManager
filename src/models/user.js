const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userSchema = require("../schemas/userSchema");
const Task = require("../models/task");

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to Log in");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to Log in");
  }

  return user;
};

userSchema.pre("save", async function (next) {
  const user = this;
  try {
    if (user.isModified("password")) {
      const salt = await bcrypt.genSalt(8);
      user.password = await bcrypt.hash(user.password, salt);
    }
  } catch (error) {
    console.log(error);
  }
  next();
});

userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRET);
  user.tokens = user.tokens.concat({ token });
  try {
    await user.save();
  } catch (e) {
    throw new Error("Email Already Exists");
  }
  return token;
};

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
};

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

const User = mongoose.model("User", userSchema);

module.exports = User;
