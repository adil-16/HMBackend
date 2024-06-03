const express = require("express");
const dashController = require("../controller/dashboard");

const dashRouter = express.Router();

dashRouter.get("/getDash", dashController.getHotels);

module.exports =  dashRouter;
