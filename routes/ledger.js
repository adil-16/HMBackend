const express = require("express");
const ledgerController = require("../controller/ledger");
const ledgerRouter = express.Router();

ledgerRouter.post("/createLedger",ledgerController.createLedger)
ledgerRouter.get("/filterLedger/:id",ledgerController.filterLedger)
ledgerRouter.get("/getAdminLedger",ledgerController.getAdminLedger)

module.exports =  ledgerRouter;