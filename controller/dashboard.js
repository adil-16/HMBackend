const Hotel = require("../models/hotel");
const User = require("../models/user");

const dashController = {
  async getHotels(req, res) {
    try {
      const roomTypeCount = await Hotel.aggregate([
        { $unwind: "$rooms" },  // Deconstructs the rooms array
        { $group: { 
            _id: "$rooms.roomType", 
            count: { $sum: 1 }
          } 
        },
        { $project: { 
            _id: 0, 
            roomType: "$_id", 
            count: 1 
          } 
        }
      ]);
  
      const roomBooked = await Hotel.aggregate([
        { $unwind: "$rooms" }, 
        { $unwind: "$rooms.beds" }, // Deconstructs the rooms array
        { $group: { 
            _id: { isBooked: { $ifNull: ["$rooms.beds.isBooked", false] } }, 
            count: { $sum: 1 }
          } 
        },
        { $project: { 
            _id: 0, 
            isBooked: "$_id.isBooked", 
            count: 1 
          } 
        }
      ]);
  
  
      const customersCount = await User.aggregate([
        {
          $match: { role: { $ne: 'admin' } }
        },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 }
          }
        }
      ]);

      let supplierCount = 0;
      let registeredCount = 0;

      customersCount.forEach((group) => {
        if (group._id === 'supplier') {
          supplierCount = group.count;
        } else if (group._id === 'customer') {
          registeredCount = group.count;
        }
      });
  
      // Handle cases where there are no booked or available rooms
      let bookedCount = 0;
      let availableCount = 0;
  
      roomBooked.forEach((group) => {
        if (group.isBooked) {
          bookedCount = group.count;
        } else {
          availableCount = group.count;
        }
      });
  
      let cards = [
        { name: "Suppliers", number: supplierCount },
        { name: "Customers", number: registeredCount },
        // { name: "Rooms", number: roomsCount[0].totalRooms[0]?.totalRooms || 0 },
        // { name: "Hotels", number: roomsCount[0].numberOfHotels[0]?.numberOfHotels || 0 },
      ];
  
      const booking = [
        { name: 'Booked', value: bookedCount },
        { name: 'Available', value: availableCount }
      ];
  
      return res.status(200).send({
        success: true,
        data: { message: "Details updated successfully", cards, rooms: roomTypeCount, roomBooked: booking },
      });
    } catch (error) {
      console.log("Error is ....", error);
      // Handle any unexpected errors
      res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
}
  
  module.exports = dashController;
  