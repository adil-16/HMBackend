const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
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
}, { timestamps: true });

const ledgerSchema = new mongoose.Schema({
  supId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() { return this.role === 'supplier'; },
    ref:"user"
   
  },
  cusId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() { return this.role === 'customer'; },
    ref:"user"
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    // required: true,
    ref: 'Hotel'
  },
  role: {
    type: String,
    enum: ['cash', 'customer', 'supplier'],
    required: true,
  },
  totalBalance:{
    type:Number
  },
  entries: [entrySchema]
}, { timestamps: true });

module.exports = mongoose.model("Ledger", ledgerSchema);
