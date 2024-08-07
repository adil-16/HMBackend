const Hotel = require("../models/hotel");

function getDayName(date) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayIndex = date.getDay(); // getDay() returns a number from 0 to 6
    return daysOfWeek[dayIndex];
  }

const roomServices = {
    dateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let datesRange = [];
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            datesRange.push(new Date(date));
        }
        return datesRange
    },
    getDailyData(room){
        
        // Parse room check-in and check-out dates
        const roomCheckin = new Date(room.checkinDate);
        const roomCheckout = new Date(room.checkoutDate);

        let dates = this.dateRange(roomCheckin, roomCheckout);

        let cost = room.totalBeds * room.beds[0].bedRate;
        
        let dailyData = [];

        let newCost = cost;

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

            if(sellingPrice == 0){
                newCost += (newCost / (dates.length -(i+1)))
            }
            else
            {
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

        return dailyData;
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
    }
}

module.exports = roomServices;