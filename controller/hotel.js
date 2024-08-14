const Hotel = require("../models/hotel");
const schedule = require("node-schedule");
const mongoose = require("mongoose");
const Poform = require("../models/poform");
const { getWastageCollection, getInventoryInfo } = require("../services/hotel");
const hotelServices = require("../services/hotel");

// Unbook a room

const deleteExpiredBookings = async () => {
  try {
    const now = new Date();
    const expiredPoforms = await Poform.find({ checkout: { $lte: now } });

    for (const poform of expiredPoforms) {
      const hotel = await Hotel.findById(poform.hotelID);
      if (hotel) {
        hotel.rooms = hotel.rooms.filter((room) => {
          const isRoomFromPoform = room.beds.some(
            (bed) =>
              bed.Booking &&
              bed.Booking.from === poform.checkin &&
              bed.Booking.to === poform.checkout &&
              bed.customer.toString() === poform.supplierID.toString()
          );
          return !isRoomFromPoform;
        });
        console.log("hotel rooms", hotel.rooms);

        // await hotel.save();
      }

      // Optionally, you can remove the Poform document after processing
      // await poform.remove();
    }

    console.log("Expired Poform bookings removed.");
  } catch (error) {
    console.error("Error deleting expired bookings:", error);
  }
};
const deleteBooking = async () => {
  try {
    const now = new Date();

    const result = await Hotel.updateMany(
      { "rooms.beds.Booking.to": { $lte: now } },
      { $set: { "rooms.$[].beds.$[bed].isBooked": false } },
      { arrayFilters: [{ "bed.Booking.to": { $lte: now } }] }
    );

    console.log("Booking(s) deleted:", result.nModified);
  } catch (error) {
    console.error("Error deleting booking(s):", error);
  }
};

// Schedule the job to run daily at midnight
schedule.scheduleJob("0 0 * * *", deleteBooking);

const getAvailableRoomsCount = (hotel) => {
  let availableRoomsCount = 0;
  hotel.rooms.forEach((room) => {
    const isRoomAvailable = room.beds.some((bed) => !bed.isBooked);
    if (isRoomAvailable) {
      availableRoomsCount++;
    }
  });
  return availableRoomsCount;
};

const getBookedRoomsCount = (hotel) => {
  let bookedRoomsCount = 0;
  hotel.rooms.forEach((room) => {
    const isRoomBooked = room.beds.every((bed) => bed.isBooked);
    if (isRoomBooked) {
      bookedRoomsCount++;
    }
  });
  return bookedRoomsCount;
};

const hotelController = {
  async getInventoryInfo(req, res){
    try {
      let date = new Date (req.query.date);
      let inventoryInfo = await getInventoryInfo(date);

      return res.status(200).send({
        success: true,
        data: {
          message: "Inventory Report has been Generated",
          inventoryInfo
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
  async getWastageCollection(req, res){
    try {
      let date = new Date (req.query.date);
      let wastageCollection = await getWastageCollection(date);

      return res.status(200).send({
        success: true,
        data: {
          message: "Wastage Collection Report Generated",
          wastageCollection
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
  async getSingleHotelOverview(req, res){
    try{
      const hotelId = req.params.id;
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);

      let hotel =  await Hotel.findById(hotelId);

      if (!hotel) {
        return res.status(404).send({
          success: false,
          data: { error: "Hotel not found" },
        });
      }

      let overview = hotelServices.getSingleHotelOverview(hotel.toObject(), startDate, endDate)

      return res.status(200).send({
        success: true,
        data: {
          message: "Hotel details found",
          overview
        },
      });

    }
    catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  }
  ,
  async getHotelDetails(req, res){
    try {
      const hotelId = req.params.id;

      let hotel = await hotelServices.getHotelDetails(hotelId);

      if (!hotel) {
        return res.status(404).send({
          success: false,
          data: { error: "Hotel not found" },
        });
      }
      console.log(hotel);
      const image = hotel.image || null;

      return res.status(200).send({
        success: true,
        data: {
          message: "Hotel details found",
          hotel: {
            ...hotel,
            image: image
          },
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
  async getSingleHotel(req, res){
    try {
      const hotelId = req.params.id;
      const hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        return res.status(404).send({
          success: false,
          data: { error: "Hotel not found" },
        });
      }

      const image = hotel.image || null;

      return res.status(200).send({
        success: true,
        data: {
          message: "Hotel details found",
          hotel: {
            ...hotel.toObject(),
            image: image
          },
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  async addHotel(req, res) {
    try {
      deleteExpiredBookings();
      console.log("in add hotel", req.body);

      const fileBuffer = req.file ? req.file.filename : null;
      let hotelData = req.body;

      if (fileBuffer != null) {
        hotelData.image = fileBuffer;
      }
      const hotelExists = await Hotel.findOne({
        name: hotelData.name,
        location: hotelData.location,
      });

      if (hotelExists) {
        return res.status(400).send({
          success: false,
          data: { error: "This hotel already exists" },
        });
      } else {
        if (typeof hotelData.rooms === "string") {
          hotelData.rooms = JSON.parse(hotelData.rooms);
        }

        let hotel = new Hotel({
          name: hotelData.name,
          totalRooms: 0,
          image: hotelData.image,
          location: hotelData.location
        });

        try {
          const registeredHotel = await hotel.save();
          console.log("hotel", registeredHotel);
          return res.status(200).send({
            success: true,
            data: {
              message: "Hotel added successfully",
              hotel: registeredHotel,
            },
          });
        } catch (error) {
          console.log(error);
          return res.status(400).send({
            success: false,
            data: { error: error.message },
          });
        }
      }
    } catch (err) {
      console.log("error", err);
      return res.status(500).send({
        success: false,
        data: { error: "Some Error Occurred" },
      });
    }
  },

  // edit hotel

  async editHotel(req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res
          .status(400)
          .send({ success: false, data: { error: "Hotel ID is required" } });
      } else {
        const updatedData = req.body;
        const hotel = await Hotel.findOne({ _id: id });
        console.log(updatedData);
        if (!hotel) {
          return res
            .status(404)
            .send({ success: false, data: { error: "Hotel not found" } });
        }

        let roomNumberCounter = hotel.rooms.length;

        const newRooms = updatedData.roomDetails.reduce((acc, roomDetail) => {
          const numRooms = parseInt(roomDetail.rooms);
          for (let i = 1; i <= numRooms; i++) {
            roomNumberCounter++;

            const beds = [];
            for (let j = 1; j <= roomDetail.beds; j++) {
              beds.push({
                bedNumber: j,
                bedRate: roomDetail.rate || 0,
              });
            }
            acc.push({
              roomType: roomDetail.type,
              roomNumber: roomNumberCounter.toString(),
              totalBeds: roomDetail.beds,
              beds: beds,
            });
          }
          return acc;
        }, []);

        const updatedRoomArray = [...hotel.rooms, ...newRooms];
        const updatedObject = {
          location: updatedData.location,
          name: updatedData.name,
          totalRooms: updatedRoomArray.length,
          rooms: updatedRoomArray,
        };

        const updatedHotel = await Hotel.findOneAndUpdate(
          { _id: id },
          updatedObject,
          {
            new: true,
          }
        );

        return res.status(200).send({
          success: true,
          data: {
            message: "Details updated successfully",
            hotel: updatedHotel,
          },
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
  async updateHotel(req, res) {
    try {
      const id = req.params.id;
      const updatedData = req.body;

      if (!id) {
        return res
          .status(400)
          .send({ success: false, data: { error: "Hotel ID is required" } });
      }

      const hotel = await Hotel.findOneAndUpdate({ _id: id }, updatedData, {
        new: true,
      });

      if (!hotel) {
        return res
          .status(404)
          .send({ success: false, data: { error: "Hotel not found" } });
      }

      return res.status(200).send({
        success: true,
        data: { message: "Details updated successfully", hotel: hotel },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // get all hotels
  async getHotels(req, res) {
    try {
      const hotels = await Hotel.find();

      const hotelList = hotels.map((hotel) => {
        let roomTypes = [];

        hotel.rooms.forEach((room) => {
          const roomTypeCount = room.totalBeds;

          roomTypes.push({
            _id: room._id,
            type: room.roomType,
            roomNumber: room.roomNumber,
            totalBeds: roomTypeCount
          });
        });

        return {
          id: hotel._id,
          name: hotel.name,
          location: hotel.location,
          totalRooms: hotel.totalRooms,
          totalBeds: hotel.rooms.reduce((sum, room) => sum + room.totalBeds, 0),
          rooms: roomTypes,
          image: hotel.image
        };
      });

      res.status(200).json({
        success: true,
        data: {
          message: "Hotels fetched successfully",
          hotels: hotelList.reverse(),
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // get hotel bookings
  async getHotelBookings(req, res) {
    try {
      const id = req.params.id;
      console.log("id is", id);
      const bookedBeds = await Hotel.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(id) } },
        { $unwind: "$rooms" },
        { $unwind: "$rooms.beds" },
        { $match: { "rooms.beds.isBooked": true } },
        {
          $lookup: {
            from: "users",
            localField: "rooms.beds.customer",
            foreignField: "_id",
            as: "rooms.beds.customerDetails",
          },
        },
        {
          $unwind: {
            path: "$rooms.beds.customerDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: 1,
            image: 1,
            location: 1,
            totalRooms: 1,
            totalBeds: 1,
            "rooms.roomType": 1,
            "rooms.roomNumber": 1,
            "rooms.beds.bedNumber": 1,
            "rooms.beds.isBooked": 1,
            "rooms.beds.Booking": 1,
            "rooms.beds.customerDetails.name": 1,
            "rooms.beds.customerDetails.image": 1,
          },
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            image: { $first: "$image" },
            location: { $first: "$location" },
            totalRooms: { $first: "$totalRooms" },
            totalBeds: { $first: "$totalBeds" },
            rooms: { $push: "$rooms" },
          },
        },
      ]);

      if (bookedBeds && bookedBeds.length > 0) {
        return res.status(200).send({
          success: true,
          data: { message: "Beds Found", rooms: bookedBeds[0].rooms },
        });
      } else {
        return res.status(404).send({
          success: false,
          data: { message: "No booked beds found", rooms: [] },
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // searh bookings
  async searchBookings(req, res) {
    try {
      const { name } = req.params;

      const pipeline = [
        { $unwind: "$rooms" },
        { $unwind: "$rooms.beds" },
        { $match: { "rooms.beds.isBooked": true } },
        {
          $lookup: {
            from: "users",
            localField: "rooms.beds.customer",
            foreignField: "_id",
            as: "rooms.beds.customerDetails",
          },
        },
        {
          $unwind: {
            path: "$rooms.beds.customerDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            hotelOrCustomerName: {
              $concat: [
                "$name",
                " ",
                { $ifNull: ["$rooms.beds.customerDetails.name", ""] },
              ],
            },
          },
        },
        ...(name
          ? [
              {
                $match: {
                  hotelOrCustomerName: { $regex: name, $options: "i" },
                },
              },
            ]
          : []),
        {
          $project: {
            hotelName: "$name",
            hotelImage: "$image",
            hotelLocation: "$location",
            hotelTotalRooms: "$totalRooms",
            "rooms.roomType": 1,
            "rooms.roomNumber": 1,
            "rooms.isBooked": 1,
            "rooms.Booking": 1,
            "rooms.customerDetails.name": 1,
            "rooms.customerDetails.image": 1,
          },
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$hotelName" },
            image: { $first: "$hotelImage" },
            location: { $first: "$hotelLocation" },
            totalRooms: { $first: "$hotelTotalRooms" },
            rooms: { $push: "$rooms" },
          },
        },
      ];

      const results = await Hotel.aggregate(pipeline);

      if (results.length > 0) {
        res.status(200).send({
          success: true,
          data: { message: "Bookings found", bookings: results },
        });
      } else {
        res.status(404).send({
          success: false,
          data: { message: "No bookings found" },
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // get all bookings
  async getAllBookings(req, res) {
    try {
      const bookedRooms = await Hotel.aggregate([
        { $unwind: "$rooms" },
        { $unwind: "$rooms.beds" },
        { $match: { "rooms.beds.isBooked": true } },
        {
          $lookup: {
            from: "users",
            localField: "rooms.beds.customer",
            foreignField: "_id",
            as: "rooms.beds.customerDetails",
          },
        },
        {
          $unwind: {
            path: "$rooms.beds.customerDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: 1,
            image: 1,
            location: 1,
            totalRooms: 1,
            "rooms.roomType": 1,
            "rooms.roomNumber": 1,
            "rooms.isBooked": 1,
            "rooms.Booking": 1,
            "rooms.customerDetails.name": 1,
            "rooms.customerDetails.image": 1,
          },
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            image: { $first: "$image" },
            location: { $first: "$location" },
            totalRooms: { $first: "$totalRooms" },
            rooms: { $push: "$rooms" },
          },
        },
      ]);

      if (bookedRooms) {
        if (bookedRooms.length > 0 && bookedRooms[0].rooms.length > 0) {
          return res.status(200).send({
            success: true,
            data: { message: "Rooms Found", rooms: bookedRooms },
          });
        } else {
          return res.status(404).send({
            success: false,
            data: { message: "No booked rooms found", rooms: [] },
          });
        }
      } else {
        return res
          .status(400)
          .send({ success: false, data: { error: err.message } });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // search hotel
  async searchHotel(req, res) {
    try {
      const value = req.params.value;

      const hotels = await Hotel.find({
        $or: [
          { name: new RegExp(value, "i") },
          { location: new RegExp(value, "i") },
        ],
      });

      if (hotels.length > 0) {
        const hotelList = hotels.map((hotel) => {
          let roomTypes = [];
          let booked = 0;
          let available = 0;

          hotel.rooms.forEach((room) => {
            room.beds.forEach((bed) => {
              if (bed.isBooked) {
                booked++;
              } else {
                available++;
              }
            });
            let existingType = roomTypes.find(
              (type) => type.type === room.roomType
            );
            if (existingType) {
              existingType.number++;
            } else {
              roomTypes.push({ type: room.roomType, number: 1 });
            }
          });

          return {
            id: hotel._id,
            name: hotel.name,
            location: hotel.location,
            totalRooms: hotel.totalRooms,
            rooms: roomTypes,
            image: hotel.image,
            available,
            booked,
          };
        });

        return res.status(200).send({
          success: true,
          data: { message: "Hotels found", hotels: hotelList },
        });
      } else {
        return res.status(404).send({
          success: false,
          data: { message: "No hotels found" },
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // get unbooked rooms
  async getunBookedBeds(req, res) {
    try {
      let id = req.params.id;
      const hotel = await Hotel.findById(id);

      if (!hotel) {
        return res
          .status(404)
          .send({ success: false, data: { error: "Hotel not found" } });
      }

      let unBookedBeds = [];
      hotel.rooms.forEach((room) => {
        room.beds.forEach((bed) => {
          if (!bed.isBooked) {
            unBookedBeds.push({
              roomNumber: room.roomNumber,
              bedNumber: bed.bedNumber,
            });
          }
        });
      });

      return res.status(200).send({
        success: true,
        data: { message: "Unbooked beds found", beds: unBookedBeds },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // book a room
  async bookBed(req, res) {
    try {
      const hotelId = req.params.id;
      const { roomId, bedId, Booking, customer } = req.body;

      if (!hotelId) {
        return res
          .status(400)
          .send({ success: false, data: { error: "Hotel ID is required" } });
      }

      const hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        return res
          .status(404)
          .send({ success: false, data: { error: "Hotel not found" } });
      }

      const room = hotel.rooms.id(roomId);
      if (!room) {
        return res
          .status(404)
          .send({ success: false, data: { error: "Room not found" } });
      }

      const bed = room.beds.id(bedId);
      if (!bed) {
        return res
          .status(404)
          .send({ success: false, data: { error: "Bed not found" } });
      }

      if (bed.isBooked) {
        return res
          .status(400)
          .send({ success: false, data: { error: "Bed is already booked" } });
      }

      bed.isBooked = true;
      bed.Booking = Booking;
      bed.customer = customer;

      await hotel.save();

      return res.status(200).send({
        success: true,
        data: { message: "Bed booked successfully" },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // delete hotel
  async deleteHotel(req, res) {
    const _id = req.params.id;
    try {
      let hotel = await Hotel.findOneAndDelete({ _id });
      if (hotel) {
        // Changed parameter name from res to result
        return res.status(200).send({
          success: true,
          data: { message: "Hotel deleted successfully" },
        });
      } else {
        return res
          .status(400)
          .send({ success: false, data: { error: "Hotel not found" } });
      }
    } catch (error) {
      // Handle any unexpected errors
      res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
};

module.exports = hotelController;

// router.post("/login", async (req, res) => {
// });
