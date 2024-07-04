const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  businessName: {
    type: String,
    required: true,
  },
  contactPerson: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "customer", "supplier"],
    required: true,
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
