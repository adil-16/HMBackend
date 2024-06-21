const express = require("express");
const router = express.Router();
const voucherController = require("../controller/voucher");

// Route to create a voucher
router.post("/vouchers", voucherController.createVoucher);

// Route to get a voucher by ID
router.get("/:id", voucherController.getVoucher);

module.exports = router;
