const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  admin: {
    type: Boolean,
    default: false,
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
    type: String
  },
  isGuest: {
    type: Boolean,
    required: true,
  },
});
module.exports = mongoose.model("user", userSchema, "users");
