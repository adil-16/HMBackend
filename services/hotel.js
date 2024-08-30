const Hotel = require("../models/hotel");
const { getHotelRanges } = require("../utils/ranges-helper");
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
            
              if(remainingCustomerData.autoAdjust && customer.bookingSubType != remainingCustomerData.bookingSubType){ //Here we are checking if the type of rooms are equal or not//
                availableBeds=0;
                break;
              }
              
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

function replaceElements(dateRanges, elementIndex, rangesToAdd){
  let newArray = [];
  for(let i = 0; i<dateRanges.length; i++){
      if(i != elementIndex){
          newArray.push(dateRanges[i])
      }
      else{
          for(let j = 0; j<rangesToAdd.length; j++){
              newArray.push(rangesToAdd[j])
          }
      }
  }
  return newArray;
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
  let availableRooms = remainingCustomerData.bookingType == "sharing"? 
  getAvailableBeds(rooms, remainingCustomerData):
  getAvailableRooms(rooms, remainingCustomerData);

  return availableRooms;
}

function rangesConflicting(range1, range2){
  return (
      (range1.checkinDate <= range2.checkinDate && range1.checkoutDate>=range2.checkoutDate)||
      (range1.checkoutDate >= range2.checkinDate && range1.checkoutDate <=range2.checkoutDate)||
      (range1.checkinDate >= range2.checkinDate && range1.checkinDate<=range2.checkoutDate)||
      (range1.checkinDate>=range2.checkinDate && range1.checkoutDate<=range2.checkoutDate)
  )
}

function getNewRoomRanges(dateRange, booking){
  let ranges = [];
  let prevRoomRange = JSON.parse(JSON.stringify(dateRange["rooms"]));
  let prevBedRange = JSON.parse(JSON.stringify(dateRange["beds"]));
  if(dateRange["checkinDate"] < booking["checkinDate"]){
      let prevDay = new Date(booking["checkinDate"].getTime() - 24*60*60*1000);
      ranges.push(
          {
              "checkinDate": dateRange["checkinDate"],
              "checkoutDate": prevDay,
              "rooms": JSON.parse(JSON.stringify(prevRoomRange)),
              "beds": JSON.parse(JSON.stringify(prevBedRange))
          }
      )
  }
  
  let midRange = {
    "checkinDate": (booking["checkinDate"]<=dateRange["checkinDate"])?dateRange["checkinDate"]:booking["checkinDate"],
    "checkoutDate": (booking["checkoutDate"]>=dateRange["checkoutDate"])?dateRange["checkoutDate"]:booking["checkoutDate"],
    "rooms": prevRoomRange,
    "beds": prevBedRange
  }
  midRange.rooms[booking.roomType]+=1
  midRange.beds[booking.roomType]+=booking.totalBeds
  midRange.rooms["Total"]+=1
  midRange.beds["Total"]+=booking.totalBeds
  ranges.push(midRange)

  if(dateRange["checkoutDate"]>booking["checkoutDate"]){
      let nextDay = new Date(booking["checkoutDate"].getTime() + 24*60*60*1000);
      ranges.push(
          {
              "checkinDate": nextDay,
              "checkoutDate": dateRange["checkoutDate"],
              "rooms": JSON.parse(JSON.stringify(prevRoomRange)),
              "beds": JSON.parse(JSON.stringify(prevBedRange))
          }
      )
  }

  return ranges;
}

function getInventoryRanges(dateRanges, rooms){
  dateRanges = JSON.parse(JSON.stringify(dateRanges));
  dateRanges[0].checkinDate = new Date(dateRanges[0].checkinDate);
  dateRanges[0].checkoutDate = new Date(dateRanges[0].checkoutDate);
  for(let i = 0; i<rooms.length; i++){
      let room = rooms[i];
      for(let j = 0; j<dateRanges.length; j++){
          if(rangesConflicting(dateRanges[j], room)){
              let newRanges = getNewRoomRanges(dateRanges[j], room);
              let prevLength = dateRanges.length;
              dateRanges = replaceElements(dateRanges, j, newRanges);
              diffLength = dateRanges.length - prevLength;
              j=j+(diffLength);
          }
      }
  }
  return dateRanges;
}

const hotelServices = {
    getSingleHotelOverview(hotel, startDate, endDate){
      let dateRanges = [{
          "checkinDate": startDate,
          "checkoutDate": endDate,
          "rooms":{
            "Quint": 0,
            "Quad": 0,
            "Triple": 0,
            "Double": 0,
            "Total": 0
          },
          "beds": {
            "Quint": 0,
            "Quad": 0,
            "Triple": 0,
            "Double": 0,
            "Total": 0
          }
      }];
      

      //1. Getting Inventory for given Range//

      //Filter the Rooms with given date range
      let availableRooms = hotel.rooms.filter((room)=>{
        return rangesConflicting(room, dateRanges[0])
      });
      //Adding it in Hotel
      let inventory = getInventoryRanges(dateRanges, availableRooms);

      //2. Getting Successful Bookings for given Range//

      //3. Getting Pending Bookings for given Range//
      return {
        "hotelId": hotel._id,
        "hotelName": hotel.name,
        "hotelLocation": hotel.location,
        "startDate": startDate,
        "endDate": endDate,
        "inventory": inventory
      }
    },
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
              bookingSubType: remainingCustomerData.bookingSubType,
              autoAdjust: remainingCustomerData.autoAdjust,
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
    },
    async getHotelsInsight(startDate, endDate){
      
      let hotels = await Hotel.find({});

      let hotelsInsight = hotels.map((hotel)=>{
        let range = {
          checkinDate: startDate,
          checkoutDate: endDate,
          rooms: {
            quint: 0,
            quad: 0,
            triple: 0,
            double: 0,
            total:0
          },
          beds: {
            quint:0,
            quad: 0,
            triple: 0,
            double: 0,
            total:0
          }
        }

        let insight = getHotelRanges(hotel, range)
        return {
          hotelId: hotel._id,
          hotelName: hotel.name,
          hotelLocation: hotel.location,
          startDate,
          endDate,
          insight: insight
        }
      })

      return hotelsInsight
    },
    async getHotelInsight(hotelId, startDate, endDate){
      let range = {
        checkinDate: startDate,
        checkoutDate: endDate,
        rooms: {
          quint: 0,
          quad: 0,
          triple: 0,
          double: 0,
          total:0
        },
        beds: {
          quint:0,
          quad: 0,
          triple: 0,
          double: 0,
          total:0
        }
      }
      let hotel = await Hotel.findById(hotelId);
      
      let insight = getHotelRanges(hotel.toObject(), range);

      return {checkinDate: startDate, checkoutDate: endDate, insight}
    }
}

module.exports = hotelServices;