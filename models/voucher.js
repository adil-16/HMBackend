const mongoose = require("mongoose");

const passSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  passportNumber: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  nationality: {
    type: String,
    required: true,
  },
});

const accommodationSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.ObjectId, ref: "hotel", required: true },
  roomType: { type: String, required: true },
  checkin: { type: Date, required: true },
  checkout: { type: Date, required: true },
  roomRate: {
    type: Number,
    required: true,
  },
  totalRooms: {
    type: Number,
    required: true,
  },
});

const voucherSchema = new mongoose.Schema({
  voucherNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.ObjectId, ref: "user", required: true },
  confirmationStatus: {
    type: String,
    enum: ["Confirmed", "Tentative"],
    required: true,
  },
  tentativeHours: {
    type: Number,
    required: function () {
      return this.confirmationStatus === "Tentative";
    },
  },
  tentativeDate: { type: Date, default: null },
  confirmationType: {
    type: String,
    enum: ["Individual", "Group"],
    default: "Group",
    required: true,
  },
  vatnumber: {
    type: String,
    required: true,
  },
  accommodations: [accommodationSchema],
  passengers: {
    type: [passSchema],
    required: true,
  },
});

voucherSchema.pre("validate", async function (next) {
  try {
    if (this.confirmationStatus === "Tentative") {
      this.tentativeDate = new Date(Date.now() + this.tentativeHours * 3600000);
    } else {
      this.tentativeDate = null;
    }
  } catch (error) {
    next(error);
  }
  next();
});

module.exports = mongoose.model("voucher", voucherSchema, "vouchers");
