const Hotel = require("../models/hotel");

const hotelServices = {
    async addHotelRooms(hotelId, roomDetails, checkin, checkout){
        const hotel = await Hotel.findOne({ _id: hotelId });
        let roomNumberCounter = hotel.rooms.length;

        const newRooms = roomDetails.reduce((acc, roomDetail) => {
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
                checkinDate: checkin,
                checkoutDate: checkout,
                roomType: roomDetail.type,
                roomNumber: roomNumberCounter.toString(),
                totalBeds: roomDetail.beds,
                beds: beds,
              });
            }
            return acc;
        }, []);
        console.log(newRooms)
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