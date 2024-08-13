const Hotel = require("../models/hotel");
const { dateRange, getDayName } = require("../utils/date-helpers");


function replaceElements(dateRanges, elementIndex, rangesToAdd){
    let newArray = [];
    for(let i = 0; i<dateRanges.length; i++){
        if(i != elementIndex){
            newArray.push(dateRanges[i])
        }
        else{
            for(let j = 0; j<rangesToAdd.length; j++){
                if(rangesToAdd[j]["noOfBeds"]!=0)
                    newArray.push(rangesToAdd[j])
            }
        }
    }
    return newArray;
}


function isBookingConflictingRange(dateRange, booking){
    return (
        (dateRange.checkinDate <= booking.checkinDate && dateRange.checkoutDate>=booking.checkoutDate)||
        (dateRange.checkoutDate >= booking.checkinDate && dateRange.checkoutDate <=booking.checkoutDate)||
        (dateRange.checkinDate >= booking.checkinDate && dateRange.checkinDate<=booking.checkoutDate)||
        (dateRange.checkinDate>=booking.checkinDate && dateRange.checkoutDate<=booking.checkoutDate)
    )
}

function getNewRanges(dateRange, booking){
    let ranges = [];
    if(dateRange["checkinDate"] < booking["checkinDate"]){
        let prevDay = new Date(booking["checkinDate"].getTime() - 24*60*60*1000);
        ranges.push(
            {
                "checkinDate": dateRange["checkinDate"],
                "checkoutDate": prevDay,
                "noOfBeds": dateRange["noOfBeds"]
            }
        )
    }
    
    ranges.push({
        "checkinDate": (booking["checkinDate"]<=dateRange["checkinDate"])?dateRange["checkinDate"]:booking["checkinDate"],
        "checkoutDate": (booking["checkoutDate"]>=dateRange["checkoutDate"])?dateRange["checkoutDate"]:booking["checkoutDate"],
        "noOfBeds": dateRange["noOfBeds"] - booking["noOfBeds"]
    })

    if(dateRange["checkoutDate"]>booking["checkoutDate"]){
        let nextDay = new Date(booking["checkoutDate"].getTime() + 24*60*60*1000);
        ranges.push(
            {
                "checkinDate": nextDay,
                "checkoutDate": dateRange["checkoutDate"],
                "noOfBeds": dateRange["noOfBeds"]
            }
        )
    }

    return ranges;
}

const roomServices = {
    getDailyData(room){
        // Parse room check-in and check-out dates
        const roomCheckin = new Date(room.checkinDate);
        const roomCheckout = new Date(room.checkoutDate);

        let dates = dateRange(roomCheckin, roomCheckout);

        let cost = room.totalBeds * room.bedRate;
        
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
                    sellingPrice += customer.bedRate * customer.noOfBeds;
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
    
    getAvailability(roomObj){
        let dateRanges = [{
            "checkinDate": roomObj["checkinDate"],
            "checkoutDate": roomObj["checkoutDate"],
            "noOfBeds": roomObj["totalBeds"]
        }]

        for(let i = 0; i<roomObj["customersData"].length; i++){
            let booking = roomObj["customersData"][i];
            for(let j = 0; j<dateRanges.length; j++){
                if(isBookingConflictingRange(dateRanges[j], booking)){
                    let newRanges = getNewRanges(dateRanges[j], booking);
                    let prevLength = dateRanges.length;
                    dateRanges = replaceElements(dateRanges, j, newRanges);
                    diffLength = dateRanges.length - prevLength;
                    j=j+(diffLength);
                }
            }
        }
        return dateRanges;
    }
}

module.exports = roomServices;