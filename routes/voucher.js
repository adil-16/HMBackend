const express = require("express");
const router = express.Router();
const voucherController = require("../controller/voucher");

router.get("/vouchers", voucherController.getAllVouchers);

// Route to create a voucher
router.post("/vouchers", voucherController.createVoucher);

// Route to get a voucher by ID
router.get("/vouchers/:id", voucherController.getVoucher);

router.get("/filtered-vouchers", voucherController.getFilteredVouchers);


module.exports = router;
