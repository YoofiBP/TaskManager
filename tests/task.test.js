require("dotenv").config({ path: "./test.env" });
const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const Task = require("../src/models/task");

const {
  taskOne,
  taskTwo,
  taskThree,
  userOne,
  userTwo,
  setupDatabase,
} = require("./fixtures/db");

beforeEach(setupDatabase);

test("Does not get tasks if not authenticated", async () => {
  await request(app).get("/tasks").send().expect(401);
});

test("Does not delete task if not owner", async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(401);

  const task = await Task.findById(taskOne._id);
  expect(task.description).toBe("Task One");
  expect(task.completed).toBeTruthy();
});

afterEach(async () => {
  await Task.deleteMany({});
});
