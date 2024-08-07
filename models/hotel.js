const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bedSchema = new Schema({
  bedNumber: {
    type: Number,
    required: true,
  },
  bedRate: {
    type: Number,
    required: true,
  },
  
  // bedType: {
  //   type: String,
  //   required:true
  // },

  isBooked: { type: Boolean, default: false },
  Booking: {
    from: {
      type: Date,
    },
    to: {
      type: Date,
    },
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
  },
});

const roomSchema = new Schema({
  roomType: {
    type: String,
    required: true,
  },
  roomNumber: {
    type: String,
    required: true,
  },
  totalBeds: {
    type: Number,
    required: true,
  },
  bedRate: Number,
  checkinDate: Date,
  checkoutDate: Date,
  customersData: {
    type: [
      {
        voucherId: {type: mongoose.Schema.ObjectId, ref: "voucher"},
        checkinDate: Date,
        checkoutDate: Date,
        roomRate: Number
      }
    ]
  },
  beds: [bedSchema]
});

const hotelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  location: {
    type: String,
    required: true,
  },
  totalRooms: {
    type: Number,
    required: true,
  },
  rooms: [roomSchema],
});
module.exports = mongoose.model("hotel", hotelSchema, "hotels");
