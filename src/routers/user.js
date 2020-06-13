const express = require("express");
const sharp = require("sharp");
const multer = require("multer");
const {
  sendWelcomeEmail,
  sendCancellationEmail,
} = require("../emails/account");
const upload = multer({
  limits: {
    fileSize: 3097152,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(".(png|jpeg|jpg|pdf)$")) {
      return cb(
        new Error(
          "The application only accepts the following formats: jpeg, jpg, png"
        )
      );
    }
    cb(undefined, true);
  },
});

const auth = require("../middleware/auth");
const userRouter = new express.Router();

const User = require("../models/user");

userRouter.post("/users/signup", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    sendWelcomeEmail(user.email);
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

userRouter.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send({ error: error.message });
    //console.log(error);
  }
});

userRouter.post("/users/logout", auth, async (req, res) => {
  try {
    const user = req.user;
    user.tokens = user.tokens.filter((token) => token.token !== req.token);
    await user.save();
    res.send(user);
  } catch (error) {
    console.log(error);
  }
});

userRouter.post("/users/logoutAll", auth, async (req, res) => {
  try {
    const user = req.user;
    user.tokens = [];
    await user.save();
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send();
    console.log(error);
  }
});

userRouter.get("/users/me", auth, async (req, res) => {
  try {
    res.status(200).send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

userRouter.patch("/users/me", auth, async (req, res) => {
  const update = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = update.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const user = req.user;
    update.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

userRouter.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancellationEmail(req.user.email);
    res.status(204).send(req.user);
  } catch (error) {
    res.status(505).send(error);
  }
});

const uploadErrorHandler = (err, req, res, next) => {
  res.status(400).send({ error: err.message });
};

userRouter
  .route("/users/me/avatar")
  .get(auth, async (req, res) => {
    try {
      const user = req.user;
      res.set("Content-Type", "image/png");
      res.send(user.avatar);
    } catch (error) {
      console.log(error);
    }
  })
  .post(
    auth,
    upload.single("avatar"),
    async (req, res) => {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 200, height: 300 })
        .png()
        .toBuffer();
      req.user.avatar = buffer;
      await req.user.save();
      res.status(200).send();
    },
    uploadErrorHandler
  )
  .delete(auth, upload.single("avatar"), async (req, res) => {
    req.user.avatar = undefined;
    try {
      await req.user.save();
      res.status(204).send(req.user);
    } catch (error) {
      console.log(error);
    }
  });

module.exports = userRouter;
