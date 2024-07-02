const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bankSchema = new Schema(
  {
    bankName: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    swiftCode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Bank", bankSchema);
