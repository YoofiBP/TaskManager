const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");

const userOneId = new mongoose.Types.ObjectId();

const userOne = {
  _id: userOneId,
  name: "yoofi",
  email: "yoofi@joseph.com",
  password: "qwerty1234",
  tokens: [{ token: jwt.sign({ _id: userOneId }, process.env.SECRET) }],
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: "effie",
  email: "effie@bonful.com",
  password: "qwerty1234",
  tokens: [{ token: jwt.sign({ _id: userTwoId }, process.env.SECRET) }],
};

const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: "Task One",
  completed: true,
  owner: userOneId._id,
};

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: "Task Two",
  completed: false,
  owner: userOneId._id,
};

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: "Task Three",
  completed: false,
  owner: userTwoId._id,
};

const setupDatabase = async () => {
  await User.deleteMany({});
  await Task.deleteMany({});
  await new User(userOne).save();
  await new User(userTwo).save();
  await new Task(taskOne).save();
  await new Task(taskTwo).save();
  await new Task(taskThree).save();
};

module.exports = {
  userOne,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase,
};
