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

test("Should create task successfully", async () => {
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

test("Should not create task with wrong details", async () => {
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
});

test("Should not create task without authentication", async () => {
  await request(app)
    .post("/tasks")
    .send({
      completed: "true",
    })
    .expect(401);
});

test("Should get all tasks belonging to the appropriate user", async () => {
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

test("Should fetch only completed tasks", async () => {
  const response = await request(app)
    .get(`/tasks?completed=true`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body).toEqual(
    expect.not.arrayContaining([
      expect.objectContaining({
        completed: false,
      }),
    ])
  );
});

test("Should not get tasks if not authenticated", async () => {
  await request(app).get("/tasks").send().expect(401);
});

test("Should get task with specific ID", async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body).toEqual(
    expect.objectContaining({
      description: "Task One",
      completed: true,
    })
  );
});

test("Should not get task if not for user", async () => {
  await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
});

test("Should update user task", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "Test Description",
      completed: false,
    })
    .expect(200);

  const task = await Task.findById(taskOne._id);
  expect(task).toEqual(
    expect.objectContaining({
      description: "Test Description",
      completed: false,
    })
  );
});

test("Should not update user task with invalid parameters", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      desc: "Test Description",
      com: false,
    })
    .expect(400);
});

test("Should not update task that does not belong to the user", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send({
      description: "Test Description",
      completed: false,
    })
    .expect(404);
});

test("Should delete task", async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(204);

  const task = await Task.findById(taskOne._id);
  expect(task).toBeFalsy();
});

test("Should not delete task if not owner", async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const task = await Task.findById(taskOne._id);
  expect(task.description).toBe("Task One");
  expect(task.completed).toBeTruthy();
});

test("Should not delete task if not authenticated", async () => {
  await request(app).delete(`/tasks/${taskOne._id}`).send().expect(401);
});

afterEach(async () => {
  await Task.deleteMany({});
});
