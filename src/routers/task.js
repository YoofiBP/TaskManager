const express = require("express");

const taskRouter = new express.Router();
const auth = require("../middleware/auth");

const Task = require("../models/task");

taskRouter.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

taskRouter.get("/tasks", auth, async (req, res) => {
  try {
    const completed = req.query.completed
      ? { completed: req.query.completed === "true" }
      : {};
    const limit = req.query.limit ? { limit: parseInt(req.query.limit) } : {};
    const skip = req.query.skip ? { skip: parseInt(req.query.skip) } : {};
    const options = Object.assign({}, limit, skip);

    const tasks = await Task.find({ owner: req.user._id, ...completed }, null, {
      sort: {
        createdAt: -1,
      },
    });
    res.send(tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

taskRouter.get("/tasks/:id", auth, async (req, res) => {
  const { id: _id } = req.params;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }

    await task.populate("owner").execPopulate();

    res.send(task);
  } catch (error) {
    res.status(500).send({ error: error });
  }
});

taskRouter.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(404).send({ error: "Invalid Update" });
  }

  const { id: _id } = req.params;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }
    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

taskRouter.delete("/tasks/:id", auth, async (req, res) => {
  const { id: _id } = req.params;

  try {
    const deletedTask = await Task.findOneAndDelete({
      _id,
      owner: req.user._id,
    });

    if (!deletedTask) {
      return res.status(401).send();
    }
    res.status(204).send(deletedTask);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = taskRouter;
