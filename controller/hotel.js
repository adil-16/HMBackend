const Hotel = require("../models/hotel");
const schedule = require("node-schedule");
const mongoose = require("mongoose");

// Unbook a room
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


 

async getSingleHotel(req, res) {
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

        const availableRoomsCount = getAvailableRoomsCount(hotel);
        const bookedRoomsCount = getBookedRoomsCount(hotel);

        return res.status(200).send({
            success: true,
            data: {
                message: "Hotel details found",
                hotel: {
                    ...hotel.toObject(),
                    image: image,
                    availableRoomsCount: availableRoomsCount,
                    bookedRoomsCount: bookedRoomsCount,
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
      console.log("in add hotel", req.body);

      const fileBuffer = req.file ? req.file.filename : null;
      let hotelData = req.body;

      if (fileBuffer != null) {
        hotelData.image = fileBuffer;
      }

      // Check if the hotel already exists
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
        if (typeof hotelData.rooms == "string") {
          hotelData.rooms = JSON.parse(hotelData.rooms);
        }

        // Calculate totalBeds and set room's totalBeds field
        let totalBeds = 0;
        if (Array.isArray(hotelData.rooms)) {
          hotelData.rooms.forEach((room) => {
            room.totalBeds = room.totalBeds;
            totalBeds += room.totalBeds;
          });
        }

        // Create a new Hotel instance
        let hotel = new Hotel({
          name: hotelData.name,
          image: hotelData.image,
          location: hotelData.location,
          totalRooms: hotelData.totalRooms,
          rooms: hotelData.rooms,
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
        const hotelRooms=await Hotel.findOne({_id:id})
        let updatedRoomArray=[...hotelRooms.rooms,...updatedData.rooms]
        let updatedObject={...updatedData,totalRooms:updatedRoomArray.length,rooms:updatedRoomArray}
        const hotel = await Hotel.findOneAndUpdate({ _id: id }, updatedObject, {
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
      }
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
        let availableBeds = 0;
        let bookedBeds = 0;

        hotel.rooms.forEach((room) => {
          const roomTypeCount = room.totalBeds;
          const availableRoomTypeCount = room.beds.filter(
            (bed) => !bed.isBooked
          ).length;

          availableBeds += availableRoomTypeCount;
          bookedBeds += roomTypeCount - availableRoomTypeCount;

          const beds = room.beds.map((bed) => ({
            bedNumber: bed.bedNumber,
            isBooked: bed.isBooked,
          }));

          roomTypes.push({
            type: room.roomType,
            roomNumber: room.roomNumber,
            totalBeds: roomTypeCount,
            beds: beds,
          });
        });

        return {
          id: hotel._id,
          name: hotel.name,
          location: hotel.location,
          totalRooms: hotel.totalRooms,
          totalBeds: hotel.rooms.reduce((sum, room) => sum + room.totalBeds, 0),
          rooms: roomTypes,
          image: hotel.image,
          availableBeds,
          bookedBeds,
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
        { $unwind: "$rooms.beds"},
        { $match: { "rooms.beds.isBooked": true } },
        {
          $lookup: {
            from: 'users',
            localField: 'rooms.beds.customer',
            foreignField: '_id',
            as: 'rooms.beds.customerDetails'
          }
        },
        {
          $unwind: {
            path: '$rooms.beds.customerDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            hotelOrCustomerName: {
              $concat: ['$name', ' ', { $ifNull: ['$rooms.beds.customerDetails.name', ''] }],
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
        { $unwind: "$rooms.beds"},
        { $match: { "rooms.beds.isBooked": true } },
        {
          $lookup: {
            from: 'users',
            localField: 'rooms.beds.customer',
            foreignField: '_id',
            as: 'rooms.beds.customerDetails'
          }
        },
        {
          $unwind: {
            path: '$rooms.beds.customerDetails',
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
            let existingType = roomTypes.find((type) => type.type === room.roomType);
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
