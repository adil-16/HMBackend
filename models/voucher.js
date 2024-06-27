const mongoose = require("mongoose");

const accommodationSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.ObjectId, ref: "hotel", required: true },
  roomType: { type: String, required: true },
  checkin: { type: Date, required: true },
  checkout: { type: Date, required: true },
  bedRate: { type: Number, required: true },
  noOfBeds: {
    type: Number,
    required: function () {
      return this.roomType === "Shared";
    },
  },
});

const voucherSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.ObjectId, ref: "user", required: true },
  confirmationStatus: {
    type: String,
    enum: ["Confirmed", "Tentative"],
    required: true,
  },
  tentativeDate: {
    type: Date,
    required: function () {
      return this.confirmationStatus === "Tentative";
    },
  },
  confirmationType: {
    type: String,
    enum: ["Individual", "Group"],
    required: true,
  },
  vatnumber: {
    type: String,
    required: true,
  },
  accommodations: [accommodationSchema],
});

module.exports = mongoose.model("voucher", voucherSchema, "vouchers");
