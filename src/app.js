const express = require("express");
const morgan = require("morgan");
const app = express();

require("./db/mongoose");
require("./emails/account");

const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

//app.use(morgan("tiny"));
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;
