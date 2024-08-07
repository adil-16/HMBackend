const express = require("express");
const ledgerController = require("../controller/ledger");
const roomController = require("../controller/room");
const ledgerRouter = express.Router();

ledgerRouter.post("/createLedger", ledgerController.createLedger);
ledgerRouter.post("/updateCurrencyRate", ledgerController.updateCurrencyRate);
ledgerRouter.get("/filterLedger/:id", ledgerController.filterLedger);
ledgerRouter.get("/filterAdminLedger", ledgerController.filterAdminLedger);
ledgerRouter.get("/getAdminLedger", ledgerController.getAdminLedger);
ledgerRouter.get("/getLedger", ledgerController.getLedger);
ledgerRouter.get("/roomLedger/:hotelId/:roomId", roomController.getRoomLedger)

module.exports = ledgerRouter;
