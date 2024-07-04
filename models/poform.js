const mongoose = require("mongoose");
const User = require("./user");
const Hotel = require("./hotel");

const Schema = mongoose.Schema;
const poformSchema = new Schema({
  supplierID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  hotelID: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "hotel",
      required: true,
    },
  ],
  checkin: {
    type: Date,
    required: true,
  },
  checkout: {
    type: Date,
    required: true,
  },
  rooms: {
    shared: {
      type: Number,
      default: 0,
    },
    quad: {
      type: Number,
      default: 0,
    },
    triple: {
      type: Number,
      default: 0,
    },
    double: {
      type: Number,
      default: 0,
    },
  },
  bedRates: {
    quint: {
      type: Number,
      // required: true,
    },
    quad: {
      type: Number,
      // required: true,
    },
    triple: {
      type: Number,
      // required: true,
    },
    double: {
      type: Number,
      // required: true,
    },
  },
});

module.exports = mongoose.model("Poform", poformSchema, "Poform");
