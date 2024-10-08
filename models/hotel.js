const mongoose = require("mongoose");

const Schema = mongoose.Schema;

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
  bedRate: {
    type: Number,
    required: true
  },
  checkinDate: Date,
  checkoutDate: Date,
  customersData: {
    type: [
      {
        voucherId: {type: mongoose.Schema.ObjectId, ref: "voucher"},
        checkinDate: Date,
        checkoutDate: Date,
        bookingType:{
          type: String,
          enum: ['sharing', 'nonSharing'] 
        },
        bookingSubType:{
          type: String,
          enum: ["male", "female", "family"]
        },
        noOfBeds: Number,
        bedRate: Number
      }
    ]
  }
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
  remainingCustomerData: [
    {
      voucherId: {type: mongoose.Schema.ObjectId, ref: "voucher"},
      checkinDate: Date,
      checkoutDate: Date,
      bookingType:{
        type: String,
        enum: ['sharing', 'nonSharing'] 
      },
      bookingSubType:{
        type: String,
        enum: ["male", "female", "family"]
      },
      autoAdjust: Boolean,
      noOfBeds: Number,
      roomType: String,
      autoAdjust: Boolean
    }
  ]
});
module.exports = mongoose.model("hotel", hotelSchema, "hotels");
