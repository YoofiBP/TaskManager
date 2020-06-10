require("dotenv").config({ path: "./test.env" });
const request = require("supertest");
const app = require("../src/app");
const jwt = require("jsonwebtoken");
const User = require("../src/models/user");
const { userOne, setupDatabase } = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should sign up new user and return appropriate response", async () => {
  const response = await request(app)
    .post("/users/signup")
    .send({
      name: "Joseph Brown-Pobee",
      email: "yoofi@email.com",
      password: "Dilweed86!",
    })
    .expect(201);

  expect(response.body).toEqual(
    expect.objectContaining({
      user: expect.not.objectContaining({ password: expect.any(String) }),
      token: expect.any(String),
    })
  );

  const decoded = await jwt.verify(response.body.token, process.env.SECRET);
  const user = await User.findById(decoded._id);
  expect(user.name).toBe("Joseph Brown-Pobee");
});

test("Should not sign up new user", async () => {
  await request(app)
    .post("/users/signup")
    .send({
      name: userOne.name,
      email: userOne.email,
      password: userOne.password,
    })
    .expect(400);

  await request(app)
    .post("/users/signup")
    .send({
      name: "Yoofi",
      email: "Yoofi",
      password: "Dilweed86!",
    })
    .expect(400);

  await request(app)
    .post("/users/signup")
    .send({
      name: "Yoofi",
      email: "yoofi@email.com",
      password: "12",
    })
    .expect(400);
});

test("Should login the user and return appropriate response", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(response.body.user._id);
  expect(user.tokens).toHaveLength(2);
  expect(user.tokens).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        token: response.body.token,
      }),
    ])
  );
});

test("Should not login the user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "yoofi@email.com",
      password: "dummypassword",
    })
    .expect(400);
});

test("Should remove token from tokens list", async () => {
  await request(app)
    .post("/users/logout")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOne._id);
  expect(user.tokens).toHaveLength(0);

  await request(app)
    .post("/users/logout")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(401);
});

test("Should remove all tokens from tokens list", async () => {
  await request(app).post("/users/login").send({
    email: userOne.email,
    password: userOne.password,
  });

  await request(app)
    .post("/users/logoutAll")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOne._id);
  expect(user.tokens).toHaveLength(0);
});

test("Should get user profile", async () => {
  const response = await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body).toEqual(
    expect.objectContaining({
      name: userOne.name,
      email: userOne.email,
    })
  );
});

test("Should delete user profile", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOne._id);
  expect(user).toBeNull();
});

//Testing file sending
test("Should upload a picture", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/kpmg_logo.5ce5b1de0dc91.jpg")
    .expect(200);

  const user = await User.findById(userOne._id);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("Should delete uploaded picture", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/kpmg_logo.5ce5b1de0dc91.jpg");

  await request(app)
    .delete("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .expect(200);

  const user = await User.findById(userOne._id);
  expect(user.avatar).toBeFalsy();
});

test("Should get picture", async () => {
  const response = await request(app)
    .get("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .expect("Content-Type", "image/png")
    .expect(200);

  expect(response.body).toEqual(expect.any(Buffer));
});

test("Should update profile", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ email: "newemail@mac.com", name: "Willy Wonka" })
    .expect(200);

  const user = await User.findById(userOne._id);
  expect(user.name).toBe("Willy Wonka");
  expect(user.email).toBe("newemail@mac.com");
});

test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ location: "newemail@mac.com" })
    .expect(400);
});

test("Should not allow unauthorized user to perform function", async () => {
  await request(app).post("/users/logout").send().expect(401);
  await request(app).post("/users/logoutAll").send().expect(401);
  await request(app).get("/users/me").send().expect(401);
  await request(app).patch("/users/me").send().expect(401);
  await request(app).delete("/users/me").send().expect(401);
  await request(app).get("/users/me/avatar").send().expect(401);
  await request(app).post("/users/me/avatar").send().expect(401);
  await request(app).delete("/users/me/avatar").send().expect(401);
});
/**Test Ideas
 * Assert that the database is changed
 * Assert that things about the response body
 */

afterEach(async () => {
  await User.deleteMany({});
});
