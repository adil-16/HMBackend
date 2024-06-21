const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const passSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
});

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "customer", "supplier"],
    required: true,
  },
  customerType: {
    type: String,
    enum: ["guest", "b2b"],
    required: function () {
      return this.role === "customer";
    },
  },
  age: {
    type: Number,
    required: function () {
      return this.role === "customer";
    },
  },
  passportNumber: {
    type: String,
    required: function () {
      return this.role === "customer" && this.customerType === "guest";
    },
  },
  passengers: {
    type: [passSchema],
    required: function () {
      return this.role === "customer" && this.customerType === "guest";
    },
  },
  image: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
});

module.exports = mongoose.model("user", userSchema, "users");
