const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    debit: {
      type: Number,
      required: true,
    },
    credit: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
    },
  },
  { timestamps: true }
);

const ledgerSchema = new mongoose.Schema(
  {
    supId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return this.role === "supplier";
      },
      ref: "user",
    },
    cusId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return this.role === "customer";
      },
      ref: "user",
    },
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return this.role === "bank";
      },
      ref: "Bank",
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    },
    role: {
      type: String,
      enum: ["cash", "customer", "supplier", "bank"],
      required: true,
    },
    totalBalance: {
      type: Number,
    },
    entries: [entrySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ledger", ledgerSchema);
