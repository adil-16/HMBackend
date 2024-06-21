const mongoose = require("mongoose");

const accommodationSchema = new mongoose.Schema({
  roomType: { type: String, required: true },
  checkin: { type: Date, required: true },
  checkout: { type: Date, required: true },
});

const voucherSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.ObjectId, ref: "hotel", required: true },
  customer: { type: mongoose.Schema.ObjectId, ref: "user", required: true },
  accommodations: [accommodationSchema],
});

module.exports = mongoose.model("voucher", voucherSchema, "vouchers");
