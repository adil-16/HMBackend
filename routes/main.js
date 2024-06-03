const express = require("express");
const userRouter = require("./user");
const hotelRouter = require("./hotel");
const dashRouter = require("./dashboard");
const authGuard = require("../middleware/authGuard.middleware");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("hello from server");
});

router.use("/user", userRouter);
router.use("/hotel", hotelRouter);
router.use("/dashboard", dashRouter);

module.exports = router;

