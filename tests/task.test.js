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

test("Creates task successfully", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "Test Description",
      completed: true,
      owner: userOne._id,
    })
    .expect(201);

  expect(response.body).toEqual(
    expect.objectContaining({
      description: "Test Description",
      completed: true,
      owner: userOne._id.toString(),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  );

  const task = await Task.findById(response.body._id);
  expect(task).toEqual(
    expect.objectContaining({
      description: "Test Description",
      completed: true,
      owner: userOne._id,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })
  );
});

test("Should not create task", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({})
    .expect(500);

  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      completed: "true",
    })
    .expect(500);

  await request(app)
    .post("/tasks")
    .send({
      completed: "true",
    })
    .expect(401);
});

test("Gets all tasks belonging to userOne", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body).toHaveLength(2);

  const response2 = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response2.body).toHaveLength(1);
});

test("Does not get tasks if not authenticated", async () => {
  await request(app).get("/tasks").send().expect(401);
});

test("Get task with specific ID", async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  console.log(response.body);

  expect(response.body).toEqual(
    expect.objectContaining({
      description: "Task One",
      completed: true,
    })
  );
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
