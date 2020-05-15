const mongoose = require("mongoose");

const CONNECTION_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_PRODUCTION
    : process.env.MONGO_LOCAL;
mongoose.connect(CONNECTION_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  dbName: "TestDB",
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connection established");
});
