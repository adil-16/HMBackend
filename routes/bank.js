const express = require("express");
const router = express.Router();
const bankController = require("../controller/bank");

router.post("/addBank", bankController.createBank);
router.get("/getBanks", bankController.getAllBanks);
router.get("/banks/:id", bankController.getBankById);
router.put("/banks/:id", bankController.updateBank);
router.delete("/banks/:id", bankController.deleteBank);

module.exports = router;
