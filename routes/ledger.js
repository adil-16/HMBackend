const express = require("express");
const ledgerController = require("../controller/ledger");
const ledgerRouter = express.Router();

ledgerRouter.post("/createLedger",ledgerController.createLedger)
ledgerRouter.get("/filterLedger/:id",ledgerController.filterLedger)
ledgerRouter.get("/filterAdminLedger",ledgerController.filterAdminLedger)
ledgerRouter.get("/getAdminLedger",ledgerController.getAdminLedger)
ledgerRouter.get("/getLedger", ledgerController.getLedger);


module.exports =  ledgerRouter;