const express = require("express");
const poformController = require("../controller/poform");


const poformRouter = express.Router();

poformRouter.post("/createPoform", poformController.createPoform);


module.exports = poformRouter;


 