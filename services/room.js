const Hotel = require("../models/hotel");
const { dateRange, getDayName } = require("../utils/date-helpers");

const roomServices = {
    getDailyData(room){
        // Parse room check-in and check-out dates
        const roomCheckin = new Date(room.checkinDate);
        const roomCheckout = new Date(room.checkoutDate);

        let dates = dateRange(roomCheckin, roomCheckout);

        let cost = room.totalBeds * room.beds[0].bedRate;
        
        let dailyData = [];

        let newCost = cost;

        let totalCost = cost*dates.length;
        let totalSale = 0;
        let totalProfit = 0;
        let vacantDays = 0;
        let bookedDays = 0;
        for(let i =0; i<dates.length; i++){
            let singleDate = dates[i];

            // Determine the selling price based on customer data
            let sellingPrice = 0;
            room.customersData.forEach(customer => {
                const customerCheckin = new Date(customer.checkinDate);
                const customerCheckout = new Date(customer.checkoutDate);
                if (customerCheckin <= singleDate && singleDate <= customerCheckout) {
                    sellingPrice += customer.roomRate;
                }
            });
            totalSale+=sellingPrice;
            if(sellingPrice == 0){
                vacantDays+=1;
                newCost += (newCost / (dates.length -(i+1)))
            }
            else
            {
                bookedDays+=1;
                if(newCost != cost){
                    for(let i = dailyData.length - 1; i>=0 && dailyData[i].booking != "Booked"; i--){
                        dailyData[i].cost = 0;
                        dailyData[i].profit = 0
                    }
                }
                cost = newCost
            }
            // Calculate the profit
            const profit = sellingPrice - cost;

            // Append the daily data to the list
            dailyData.push({
                date: singleDate.toISOString().split('T')[0],
                day: getDayName(singleDate),
                cost: cost,
                sellingPrice: sellingPrice,
                profit: profit,
                booking: (sellingPrice == 0)? "Vacant":"Booked"
            });

            // Append the daily data to the list using array of arrays
            // dailyData.push([
            //     singleDate.toISOString().split('T')[0], // Date
            //     cost, //Cost
            //     sellingPrice, //Selling Price
            //     profit, //Profit
            //     (sellingPrice == 0)? "Vacant":"Booked" //Booking Status
            // ]);
        }
        totalProfit = totalSale - totalCost;

        return {
            totalCost,
            totalSale,
            totalProfit,
            vacantDays,
            bookedDays,
            roomLedger: dailyData
        };
    },
    async getRoomLedger(hotelId, roomId){
        //Find Hotel
        let hotel = await Hotel.findById(hotelId);
        if(!hotel)
            throw new Error("Hotel not found.");
        //Find Room
        let room = hotel.rooms.find(hotelRoom=>hotelRoom._id==roomId)
        if(!room)
            throw new Error("Room not found.");
        //
        let roomDailyData = this.getDailyData(room);

        return roomDailyData;
    },
    async bookingRooms(hotelId, bookingInfo, checkin, checkout){
        // {
        //     "quint": 2, // Number of Rooms in given room type//
        //     "quad": 3,
        //     "triple": 4,
        //     "double": 2
        // }
    },
    async bookingRoomBeds(hotelId, bookingInfo, checkin, checkout){
        // {
        //     "quint": 2, // Number of Beds in given room type//
        //     "quad": 3,
        //     "triple": 4,
        //     "double": 2
        // }
    }
}

module.exports = roomServices;