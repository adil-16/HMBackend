const mongoose = require("mongoose");

const voucherentrySchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    amount:{
        type:Number,
        required:true
      }
  
  }, { timestamps: true });
const paymentVoucherSchema = new mongoose.Schema({
  supId: {
    type: String,
    required: true,
   
  },
  entries:[voucherentrySchema]
 
}, { timestamps: true });

module.exports = mongoose.model("paymentvoucher", paymentVoucherSchema);
