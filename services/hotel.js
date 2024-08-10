const Hotel = require("../models/hotel");

function getAvailableBeds(rooms, remainingCustomerData){
  let availableRooms = []
  // Filter rooms based on accommodation's room type and date range even if only 1 bed is available
  for(let i = 0; i<rooms.length; i++){
      let room = rooms[i];

      if(room.roomType !== accommodation.roomType){
          continue; 
      }

      // Check if accommodation's dates fall within room's checkin and checkout dates
      if (
          accommodation.checkin < room.checkinDate ||
          accommodation.checkout > room.checkoutDate
      ) {
          return false;
      }

      //Check collision with customers booking
      let availableBeds = room.totalBeds;
      for(let i = 0; i<room.customersData.length && availableBeds>0; i++){
          let customer = room.customersData[i];
          if((remainingCustomerData.checkinDate.getTime() == customer.checkoutDate.getTime()) || // Covering Edge Case
          (remainingCustomerData.checkoutDate.getTime() == customer.checkinDate.getTime()) ||
          (remainingCustomerData.checkinDate >= customer.checkinDate && remainingCustomerData.checkinDate < customer.checkoutDate) ||
          (remainingCustomerData.checkoutDate > customer.checkinDate && remainingCustomerData.checkoutDate <= customer.checkoutDate) ||
          (remainingCustomerData.checkinDate <= customer.checkinDate && remainingCustomerData.checkoutDate >= customer.checkoutDate))
          {
              availableBeds-=customer.noOfBeds;
          }
      }

      //if beds are greater than 0 then add field for the availableBeds in room and add room in availableRooms.
      if(availableBeds == room.totalBeds){
          room.availableBeds = availableBeds;
          availableRooms.push(room)
      }
      else if(availableBeds > 0){
          room.availableBeds = availableBeds;
          availableRooms.unshift(room)
      }
  }

// Return the number of available rooms
  return availableRooms;
}

function getAvailableRooms(rooms, remainingCustomerData) {
// Filter rooms based on accommodation's room type and date range
const availableRooms = rooms.filter((room) => {
  // Check if the room type matches
  if (room.roomType !== accommodation.roomType) {
    return false;
  }
  // Check if accommodation's dates intersect with any of the customer's data dates
  const isIntersectingWithCustomerData = room.customersData.some((customer) => {
    return (
      (remainingCustomerData.checkinDate.getTime() == customer.checkoutDate.getTime()) || // Covering Edge Case
          (remainingCustomerData.checkoutDate.getTime() == customer.checkinDate.getTime()) ||
          (remainingCustomerData.checkinDate >= customer.checkinDate && remainingCustomerData.checkinDate < customer.checkoutDate) ||
          (remainingCustomerData.checkoutDate > customer.checkinDate && remainingCustomerData.checkoutDate <= customer.checkoutDate) ||
          (remainingCustomerData.checkinDate <= customer.checkinDate && remainingCustomerData.checkoutDate >= customer.checkoutDate)
    );
  });

  // If there's an intersection with customer data, the room is not available
  return !isIntersectingWithCustomerData;
}).map(room=>{return {...room, availableBeds: room.totalBeds}});

return availableRooms

}

function filterAvailableRooms(rooms, remainingCustomerData){
  let availableRooms = remainingCustomerData.bookingType == "bed"? 
  getAvailableBeds(rooms, remainingCustomerData):
  getAvailableRooms(rooms, remainingCustomerData);

  return availableRooms;
}

const hotelServices = {
    async addHotelRooms(hotelId, roomDetails, checkin, checkout){
        const hotel = await Hotel.findOne({ _id: hotelId });
        let roomNumberCounter = hotel.rooms.length;

        const newRooms = roomDetails.reduce((acc, roomDetail) => {
            const numRooms = parseInt(roomDetail.rooms);
            for (let i = 1; i <= numRooms; i++) {
              roomNumberCounter++; 
              acc.push({
                checkinDate: checkin,
                checkoutDate: checkout,
                roomType: roomDetail.type,
                roomNumber: roomNumberCounter.toString(),
                totalBeds: roomDetail.beds,
                bedRate: roomDetails.bedRate
              });
            }
            return acc;
        }, []);
        // remainingCustomerData: [
        //   {
        //     voucherId: {type: mongoose.Schema.ObjectId, ref: "voucher"},
        //     checkinDate: Date,
        //     checkoutDate: Date,
        //     bookingType: String,
        //     noOfBeds: Number,
        //     roomType: String
        //   }
        // ]
        //Check if there are some remaining customer data | pending room bookings
        for(let i = 0; i<hotel.remainingCustomerData.length; i++){
          let remainingCustomerData = hotel.remainingCustomerData[i];
          let remainingBeds = remainingCustomerData.noOfBeds;
          //Check for checkin and checkout, as it is same for all the rooms so no need to check all rooms//
          if(remainingCustomerData.checkinDate < checkin || remainingCustomerData.checkout > checkout)
            continue;
          let availableRooms = filterAvailableRooms(newRooms, remainingCustomerData);
          for(let i = 0; i<availableRooms.length && remainingBeds>0; i++){
            let room = availableRooms[i];
            let bedsToBeBooked = room.availableBeds
            if(room.availableBeds>remainingBeds){
              bedsToBeBooked = remainingBeds
            }
            room.customersData.push({
              voucherId: voucher._id,
              checkinDate: remainingCustomerData.checkinDate,
              checkoutDate: remainingCustomerData.checkoutDate,
              bedRate: remainingCustomerData.bedRate,
              bookingType: remainingCustomerData.bookingType,
              noOfBeds: bedsToBeBooked
            })
            remainingBeds-=bedsToBeBooked;
          }

          //if a remainingCustomerData Order is fullfilled then delete it from hotel//
          if(remainingBeds == 0){
            hotel.remainingCustomerData.splice(i--, 1);
          }
        }
        const updatedRoomArray = [...hotel.rooms, ...newRooms];
        const updatedObject = {
            totalRooms: updatedRoomArray.length,
            rooms: updatedRoomArray,
        };

        const updatedHotel = await Hotel.findOneAndUpdate({ _id: hotelId }, updatedObject, {
            new: true,
        });
        
        let newlyAddedRooms = updatedHotel.rooms.filter((room)=>{
            let notFound = true;
            hotel.rooms.forEach((prevRooms)=>{if(prevRooms._id == room._id){
                notFound = false;
            }})
            return notFound;
        })

        return newlyAddedRooms;
    }
} 

module.exports = hotelServices;