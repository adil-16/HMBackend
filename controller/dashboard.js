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
        { $unwind: "$rooms" },  // Deconstructs the rooms array
        { $group: { 
            _id: { isBooked: { $ifNull: ["$rooms.isBooked", false] } }, 
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
          $group: {
            _id: "$isGuest",
            count: { $sum: 1 },
          },
        },
      ]);
  
      const roomsCount = await Hotel.aggregate([
        {
          $facet: {
            totalRooms: [
              { $unwind: "$rooms" },
              { $group: { _id: null, totalRooms: { $sum: 1 } } },
              { $project: { _id: 0, totalRooms: 1 } }
            ],
            numberOfHotels: [
              { $group: { _id: null, numberOfHotels: { $sum: 1 } } },
              { $project: { _id: 0, numberOfHotels: 1 } }
            ]
          }
        }
      ]);
  
      // Extract the counts
      let guestCount = 0;
      let registeredCount = 0;
  
      customersCount.forEach((group) => {
        if (group._id) {
          guestCount = group.count;
        } else {
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
        { name: "Guests", number: guestCount },
        { name: "Customers", number: registeredCount },
        { name: "Rooms", number: roomsCount[0].totalRooms[0]?.totalRooms || 0 },
        { name: "Hotels", number: roomsCount[0].numberOfHotels[0]?.numberOfHotels || 0 },
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
  