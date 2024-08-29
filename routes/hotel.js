const express = require("express");
const hotelController = require("../controller/hotel");

const uploadMiddleware = require("../middleware/uploadFile");

const hotelRouter = express.Router();

hotelRouter.post("/addHotel",
uploadMiddleware.single("file"),
 hotelController.addHotel);
hotelRouter.put("/editHotel/:id", hotelController.editHotel);
hotelRouter.put("/updateHotel/:id", hotelController.updateHotel);
hotelRouter.put("/bookBed/:id", hotelController.bookBed);
hotelRouter.get("/getBookedBeds/:id", hotelController.getHotelBookings);
hotelRouter.get("/getAllBooking", hotelController.getAllBookings);
hotelRouter.get("/getHotels", hotelController.getHotels);
hotelRouter.get("/getUnbookedBeds/:id", hotelController.getunBookedBeds);
hotelRouter.get("/search/:value", hotelController.searchHotel);
hotelRouter.get("/booking/search/:name", hotelController.searchBookings);
hotelRouter.delete("/deleteHotel/:id", hotelController.deleteHotel);
hotelRouter.get("/getHotel/:id", hotelController.getSingleHotel);
hotelRouter.get("/wastageCollection", hotelController.getWastageCollection)
hotelRouter.get("/inventoryInfo", hotelController.getInventoryInfo);
hotelRouter.get("/getHotelDetails/:id", hotelController.getHotelDetails)
hotelRouter.get("/getOverview/:id", hotelController.getSingleHotelOverview);
hotelRouter.get("/getRanges/:id", hotelController.getHotelRanges);
hotelRouter.get("/insights", hotelController.getInsights)
module.exports =  hotelRouter;