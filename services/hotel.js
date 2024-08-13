const Hotel = require("../models/hotel");
const roomServices = require("./room");

function getAvailableBeds(rooms, remainingCustomerData){
  let availableRooms = []
  // Filter rooms based on accommodation's room type and date range even if only 1 bed is available
  for(let i = 0; i<rooms.length; i++){
      let room = rooms[i];

      if(room.roomType !== remainingCustomerData.roomType){
          continue; 
      }

      // Check if accommodation's dates fall within room's checkin and checkout dates
      if (
        remainingCustomerData.checkinDate < room.checkinDate ||
        remainingCustomerData.checkoutDate > room.checkoutDate
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
  if (room.roomType !== remainingCustomerData.roomType) {
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
                bedRate: roomDetail.rate,
                customersData:[]
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
              voucherId: remainingCustomerData.voucherId,
              checkinDate: remainingCustomerData.checkinDate,
              checkoutDate: remainingCustomerData.checkoutDate,
              bedRate: remainingCustomerData.bedRate,
              bookingType: remainingCustomerData.bookingType,
              noOfBeds: bedsToBeBooked
            })
            remainingBeds-=bedsToBeBooked;
          }

          //if a remainingCustomerData Order is fullfilled then delete it from hotel//
          if(remainingBeds <= 0){
            hotel.remainingCustomerData.splice(i--, 1);
          }
          else{
            hotel.remainingCustomerData[i].noOfBeds = remainingBeds
          }
        }
        const updatedRoomArray = [...hotel.rooms, ...newRooms];
        const updatedObject = {
            totalRooms: updatedRoomArray.length,
            rooms: updatedRoomArray,
            remainingCustomerData: hotel.remainingCustomerData
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
    },
    getWastageCollectionOfSingleHotel(hotel, date){
      let roomsForCurrentDate = hotel.rooms.filter((room) => {
        return (room.checkinDate <= date && room.checkoutDate>=date)
      })
      
      let totalBedsAvailable = {
        "Quint": 0,
        "Quad": 0,
        "Triple": 0,
        "Double": 0,
        "Total": 0
      }
      let totalRoomsAvailable = {
        "Quint": 0,
        "Quad": 0,
        "Triple": 0,
        "Double": 0,
        "Total": 0
      }
      roomsForCurrentDate.forEach((room)=>{
        let roomBooked = false;
        let remainingBeds = room.totalBeds;
        for(let i = 0; i<room.customersData.length && remainingBeds>0; i++){
          if(date <= room.customersData[i].checkoutDate && date >= room.customersData[i].checkinDate )
          {
            roomBooked=true;
            remainingBeds-=room.customersData[i].noOfBeds;
          }
        }
        if(!roomBooked)
          totalRoomsAvailable[room.roomType] = totalRoomsAvailable[room.roomType] + 1
        totalBedsAvailable[room.roomType]+=remainingBeds
      })
      for(let key in totalBedsAvailable){
        if(key!="Total")//Adding Everything in Total
        {
          totalBedsAvailable["Total"]+=totalBedsAvailable[key];
          totalRoomsAvailable["Total"]+=totalRoomsAvailable[key];
        }
      }
      return {
        hotelId: hotel._id,
        totalRoomsForDate: roomsForCurrentDate.length,
        hotelName: hotel.name,
        date: date,
        totalBedsAvailable,
        totalRoomsAvailable
      }
    },
    async getWastageCollection(date){
      let hotels = await Hotel.find({});
      let wastageCollection = hotels.map((hotel)=>{return hotelServices.getWastageCollectionOfSingleHotel(hotel, date)})
      return wastageCollection
    },
    getPendingBookingsOfSingleHotel(hotel, date){
      let remainingVouchers = hotel.remainingCustomerData.filter((customerData) => {
        return (customerData.checkinDate <= date && customerData.checkoutDate>=date)
      })
      const roomNumbers = {
        "Quint": 5,
        "Quad": 4,
        "Triple": 3,
        "Double": 2
      }
      let pendingBedsBooking = {
        "Quint": 0,
        "Quad": 0,
        "Triple": 0,
        "Double": 0,
        "Total": 0
      }
      let pendingRoomsBooking = {
        "Quint": 0,
        "Quad": 0,
        "Triple": 0,
        "Double": 0,
        "Total": 0
      }
      remainingVouchers.forEach((voucher)=>{
        pendingBedsBooking[voucher.roomType]+=voucher.noOfBeds;
      })
      for(let key in pendingBedsBooking){
        if(key!="Total")//Adding Everything in Total
        {
          let noOfRooms = Math.ceil(pendingBedsBooking[key]/roomNumbers[key]);
          pendingRoomsBooking[key] = noOfRooms;
          pendingBedsBooking["Total"]+=pendingBedsBooking[key];
          pendingRoomsBooking["Total"]+=pendingRoomsBooking[key];
        }
      }
      //Adding everything value in total
      return {
        hotelId: hotel._id,
        hotelName: hotel.name,
        date: date,
        pendingBedsBooking,
        pendingRoomsBooking
      }
    },
    async getPendingBookings(date){
      let hotels = await Hotel.find({});
      let pendingRoomsBooking = hotels.map((hotel)=>{return hotelServices.getPendingBookingsOfSingleHotel(hotel, date)})
      return pendingRoomsBooking
    },
    async getInventoryInfo(date){
      let hotels = await Hotel.find({});
      let inventoryInfo = hotels.map((hotel)=>{
        let pendingBookings = hotelServices.getPendingBookingsOfSingleHotel(hotel, date);
        let availableSlots = hotelServices.getWastageCollectionOfSingleHotel(hotel, date);
        return({
          hotelId: hotel._id,
          hotelName: hotel.name,
          location: hotel.location,
          date: date,
          roomsInventory:{
            "Quint": availableSlots.totalRoomsAvailable["Quint"] - pendingBookings.pendingRoomsBooking["Quint"],
            "Quad":  availableSlots.totalRoomsAvailable["Quad"] - pendingBookings.pendingRoomsBooking["Quad"],
            "Triple":  availableSlots.totalRoomsAvailable["Triple"] - pendingBookings.pendingRoomsBooking["Triple"],
            "Double":  availableSlots.totalRoomsAvailable["Double"] - pendingBookings.pendingRoomsBooking["Double"],
            "Total":  availableSlots.totalRoomsAvailable["Total"] - pendingBookings.pendingRoomsBooking["Total"]
          },
          bedsInventory:{
            "Quint": availableSlots.totalBedsAvailable["Quint"] - pendingBookings.pendingBedsBooking["Quint"],
            "Quad":  availableSlots.totalBedsAvailable["Quad"] - pendingBookings.pendingBedsBooking["Quad"],
            "Triple":  availableSlots.totalBedsAvailable["Triple"] - pendingBookings.pendingBedsBooking["Triple"],
            "Double":  availableSlots.totalBedsAvailable["Double"] - pendingBookings.pendingBedsBooking["Double"],
            "Total":  availableSlots.totalBedsAvailable["Total"] - pendingBookings.pendingBedsBooking["Total"]
          }
        })
      })
      return inventoryInfo;
    },
    async getHotelDetails(hotelId){
      let hotel = await Hotel.findById(hotelId);
      let plainHotel = hotel.toObject()
      if(hotel){
        for(let i = 0; i<plainHotel.rooms.length; i++){
          plainHotel.rooms[i].availability = roomServices.getAvailability(plainHotel.rooms[i])
        }
      }
      return plainHotel;
    }
}

module.exports = hotelServices;