const express = require("express");
const userRouter = require("./user");
const hotelRouter = require("./hotel");
const dashRouter = require("./dashboard");
const ledgerRouter = require("./ledger");
const poformRouter = require("./poform");
const bank = require("./bank");
const paymentVoucherRouter = require("./payment-voucher");
const hotelVoucher = require("./voucher");
const authGuard = require("../middleware/authGuard.middleware");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("hello from server");
});

router.use("/user", userRouter);
router.use("/hotel", hotelRouter);
router.use("/dashboard", dashRouter);
router.use("/ledger", ledgerRouter);
router.use("/poform", poformRouter);
router.use("/payment-voucher", paymentVoucherRouter);
router.use("/hotel-voucher", hotelVoucher);
router.use("/bank", bank);

module.exports = router;
