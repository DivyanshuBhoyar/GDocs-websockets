const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

console.log(process.env.DB_ACCESS_URI);

const start = async () => {
  try {
    await mongoose.connect(process.env.DB_ACCESS_URI, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Mongo Atlas connected");
  } catch (error) {
    console.error(error);
  }
};
start();
const wss = new Server(process.env.PORT || 4000, {
  cors: "*",
});

module.exports.io = wss;
