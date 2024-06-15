const express = require("express");
const paymentVoucherController = require("../controller/payment-voucher");
const paymentVoucherRouter = express.Router();

paymentVoucherRouter.post("/debitpayment",paymentVoucherController.debitpayment)

module.exports =  paymentVoucherRouter;