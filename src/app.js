const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("../routes/main");
const initSocket = require("../routes/socket");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");

class App {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.http = new http.Server(this.app);
    this.io = require("socket.io")(this.http, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      cors: {
        origin: "*",
      },
    });
    this.PORT = process.env.PORT || 8000;
    this.initMiddleware();
    this.connectToMongoDB();
    this.initRoutes();
  }
  initMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    dotenv.config();
  }
  connectToMongoDB() {
    const db = process.env.MONGO_CONNECTION;
    mongoose.connect(
      db,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      },
      (err, db) => {
        if (err) {
          console.log("err", err);
        } else {
          console.log("db connected");
        }
      }
    );
  }
  initRoutes() {
    const folderPath = __dirname;
    const publicPath = path.join(folderPath, "..", "public");

    this.app.use(express.static(publicPath));
    this.app.use("/", router);
    initSocket(this.io);
  }
  createServer() {
    this.http.listen(this.PORT, () => {
      console.log("Server started at port 8000");
    });
  }
}

module.exports = App;
