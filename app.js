const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("./routes/main");
const { initSocket, notifyClients } = require("./routes/socket");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const schedule = require("node-schedule");
const Hotel = require("./models/hotel");
const Poform = require("./models/poform");

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
    this.initScheduledJobs();
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
        useFindAndModify: false,
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
  initScheduledJobs() {
    schedule.scheduleJob("0 0 * * *", this.deleteExpiredBookings.bind(this));
  }

  async deleteExpiredBookings() {
    try {
      const now = new Date();
      const expiredPoforms = await Poform.find({ checkout: { $lte: now } });

      for (const poform of expiredPoforms) {
        const hotel = await Hotel.findById(poform.hotelID);
        if (hotel) {
          hotel.rooms = hotel.rooms.filter((room) => {
            const isRoomFromPoform = room.beds.some(
              (bed) =>
                bed.Booking &&
                bed.Booking.from.getTime() === poform.checkin.getTime() &&
                bed.Booking.to.getTime() === poform.checkout.getTime() &&
                bed.customer.toString() === poform.supplierID.toString()
            );
            return !isRoomFromPoform;
          });

          await hotel.save();
        }

        // Optionally, you can remove the Poform document after processing
        // await poform.remove();
      }

      console.log("Expired Poform bookings removed.");
    } catch (error) {
      console.error("Error deleting expired bookings:", error);
    }
  }
  createServer() {
    this.http.listen(this.PORT, () => {
      console.log("Server started at port 8000");
    });
  }
}

module.exports = App;
