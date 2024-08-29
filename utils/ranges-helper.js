/*
ranges structure : {
    checkinDate: Date,
    checkoutDate: Date,
    rooms:{
        quint: Number,
        quad: Number,
        triple: Number,
        double: Number
    },
    beds:{
        quint: Number,
        quad: Number,
        triple: Number,
        double: Number
    }
}
*/
const roomTypesBeds = {
    "Quint": 5,
    "Quad": 4,
    "Triple": 3,
    "Double": 2
}

function ceilUpRanges(ranges){
    for(let i = 0;i <ranges.length; i++){
        ranges[i].rooms = {
            quint: Math.ceil(ranges[i].rooms.quint),
            quad: Math.ceil(ranges[i].rooms.quad),
            triple: Math.ceil(ranges[i].rooms.triple),
            double: Math.ceil(ranges[i].rooms.double),
            total: Math.ceil(ranges[i].rooms.total)
        }
    }
    return ranges;
}

function createRangeCopy(range){
    return {
        checkinDate: new Date(range.checkinDate),
        checkoutDate: new Date(range.checkoutDate),
        beds:{
            ...range.beds
        },
        rooms:{
            ...range.rooms
        }
    }
}

function expandDateRanges(dateRanges) {
    const expandedData = [];

    dateRanges.forEach(range => {
        const checkinDate = new Date(range.checkinDate);
        const checkoutDate = new Date(range.checkoutDate);

        // Iterate from check-in to check-out date, excluding checkout date
        for (let date = new Date(checkinDate); date <= checkoutDate; date.setDate(date.getDate() + 1)) {
            expandedData.push({
                Date: new Date(date), // Format as YYYY-MM-DD
                rooms: { ...range.rooms },
                beds: { ...range.beds }
            });
        }
    });

    return expandedData;
}


function isRangeConflicting(currentRange, rangeToBeAdded){
    return (
        (currentRange.checkinDate <= rangeToBeAdded.checkinDate && currentRange.checkoutDate>=rangeToBeAdded.checkoutDate)||
        (currentRange.checkoutDate >= rangeToBeAdded.checkinDate && currentRange.checkoutDate <=rangeToBeAdded.checkoutDate)||
        (currentRange.checkinDate >= rangeToBeAdded.checkinDate && currentRange.checkinDate<=rangeToBeAdded.checkoutDate)||
        (currentRange.checkinDate>=rangeToBeAdded.checkinDate && currentRange.checkoutDate<=rangeToBeAdded.checkoutDate)
    )
}

function mergeRangeArrays(primaryRanges, targetRanges, performFunction){
    let copyPrimaryRanges  = primaryRanges.map(createRangeCopy);
    for(let i = 0; i<targetRanges.length; i++){
        for(let j = 0; j<copyPrimaryRanges.length; j++){
            if(!isRangeConflicting(copyPrimaryRanges[j], targetRanges[i]))
                continue;
            let prevLength = copyPrimaryRanges.length
            let newRanges = performFunction(copyPrimaryRanges[j], targetRanges[i]);
            copyPrimaryRanges = [...copyPrimaryRanges.slice(0,j), ...newRanges, ...copyPrimaryRanges.slice(j+1, copyPrimaryRanges.length)];
            let newLength = copyPrimaryRanges.length
            let differenceOfLength = newLength-prevLength;
            j+=differenceOfLength;
        }
    }

    return copyPrimaryRanges;
}

function subNewRange(currentRange, rangeToBeSubbed){
    let ranges = [];
    if(currentRange["checkinDate"] < rangeToBeSubbed["checkinDate"]){
        let prevDay = new Date(rangeToBeSubbed["checkinDate"].getTime() - 24*60*60*1000);
        ranges.push(
            {
                "checkinDate": currentRange["checkinDate"],
                "checkoutDate": prevDay,
                "rooms": {...currentRange.rooms},
                "beds": {...currentRange.beds}
            }
        )
    }
    
    ranges.push({
        "checkinDate": (rangeToBeSubbed["checkinDate"]<=currentRange["checkinDate"])?new Date(currentRange["checkinDate"]):new Date(rangeToBeSubbed["checkinDate"]),
        "checkoutDate": (rangeToBeSubbed["checkoutDate"]>=currentRange["checkoutDate"])?new Date(currentRange["checkoutDate"]):new Date(rangeToBeSubbed["checkoutDate"]),
        "rooms": {
            quint: currentRange.rooms.quint - rangeToBeSubbed.rooms.quint,
            quad: currentRange.rooms.quad - rangeToBeSubbed.rooms.quad,
            triple: currentRange.rooms.triple - rangeToBeSubbed.rooms.triple,
            double: currentRange.rooms.double - rangeToBeSubbed.rooms.double,
            total: currentRange.rooms.total - rangeToBeSubbed.rooms.total,
        },
        "beds":{
            quint: currentRange.beds.quint - rangeToBeSubbed.beds.quint,
            quad: currentRange.beds.quad - rangeToBeSubbed.beds.quad,
            triple: currentRange.beds.triple - rangeToBeSubbed.beds.triple,
            double: currentRange.beds.double - rangeToBeSubbed.beds.double,
            total: currentRange.beds.total - rangeToBeSubbed.beds.total,
        }
    })

    if(currentRange["checkoutDate"]>rangeToBeSubbed["checkoutDate"]){
        let nextDay = new Date(rangeToBeSubbed["checkoutDate"].getTime() + 24*60*60*1000);
        ranges.push(
            {
                "checkinDate": nextDay,
                "checkoutDate": currentRange["checkoutDate"],
                "rooms": {...currentRange.rooms},
                "beds": {...currentRange.beds}
            }
        )
    }

    return ranges;
}
function addNewRange(currentRange, rangeToBeAdded){
    let ranges = [];
    if(currentRange["checkinDate"] < rangeToBeAdded["checkinDate"]){
        let prevDay = new Date(rangeToBeAdded["checkinDate"].getTime() - 24*60*60*1000);
        ranges.push(
            {
                "checkinDate": currentRange["checkinDate"],
                "checkoutDate": prevDay,
                "rooms": {...currentRange.rooms},
                "beds": {...currentRange.beds}
            }
        )
    }
    
    ranges.push({
        "checkinDate": (rangeToBeAdded["checkinDate"]<=currentRange["checkinDate"])?new Date(currentRange["checkinDate"]):new Date(rangeToBeAdded["checkinDate"]),
        "checkoutDate": (rangeToBeAdded["checkoutDate"]>=currentRange["checkoutDate"])?new Date(currentRange["checkoutDate"]):new Date(rangeToBeAdded["checkoutDate"]),
        "rooms": {
            quint: currentRange.rooms.quint + rangeToBeAdded.rooms.quint,
            quad: currentRange.rooms.quad + rangeToBeAdded.rooms.quad,
            triple: currentRange.rooms.triple + rangeToBeAdded.rooms.triple,
            double: currentRange.rooms.double + rangeToBeAdded.rooms.double ,
            total: currentRange.rooms.total + rangeToBeAdded.rooms.total              
        },
        "beds":{
            quint: currentRange.beds.quint + rangeToBeAdded.beds.quint,
            quad: currentRange.beds.quad + rangeToBeAdded.beds.quad,
            triple: currentRange.beds.triple + rangeToBeAdded.beds.triple,
            double: currentRange.beds.double + rangeToBeAdded.beds.double,
            total: currentRange.beds.total + rangeToBeAdded.beds.total       
        }
    })

    if(currentRange["checkoutDate"]>rangeToBeAdded["checkoutDate"]){
        let nextDay = new Date(rangeToBeAdded["checkoutDate"].getTime() + 24*60*60*1000);
        ranges.push(
            {
                "checkinDate": nextDay,
                "checkoutDate": currentRange["checkoutDate"],
                "rooms": {...currentRange.rooms},
                "beds": {...currentRange.beds}
            }
        )
    }

    return ranges;
}

function roomToRange(room){
    return {
        checkinDate: room.checkinDate,
        checkoutDate: room.checkoutDate,
        rooms:{
            quint: room.roomType == "Quint"?1:0,
            quad: room.roomType == "Quad"?1:0,
            triple: room.roomType == "Triple"?1:0,
            double: room.roomType == "Double"?1:0,
            total: 1
        },
        beds:{
            quint: room.roomType == "Quint"?5:0,
            quad: room.roomType == "Quad"?4:0,
            triple: room.roomType == "Triple"?3:0,
            double: room.roomType == "Double"?2:0,
            total: room.totalBeds
        }
    }
}

function roomBookingToRanges(room, range){
    let rangeCopy = createRangeCopy(range);
    let ranges = [rangeCopy];
    for(let i = 0; i<room.customersData.length; i++){
        let customerRange = customerDataToRange(room.customersData[i], room.roomType);
        if(!isRangeConflicting(range, customerRange))
            continue;
        for(let j = 0; j<ranges.length; j++){
            if(!isRangeConflicting(ranges[j], customerRange))
                continue;
            let prevLength = ranges.length
            let newRanges = addNewRange(ranges[j], customerRange);
            ranges = [...ranges.slice(0,j), ...newRanges, ...ranges.slice(j+1, ranges.length)];
            let newLength = ranges.length
            let differenceOfLength = newLength-prevLength;
            j+=differenceOfLength;
        }
    }
    //At this Stage there must be bookings in which rooms are in float value, round them up
    for(let i = 0;i <ranges.length; i++){
        ranges[i].rooms = {
            quint: Math.ceil(ranges[i].rooms.quint),
            quad: Math.ceil(ranges[i].rooms.quad),
            triple: Math.ceil(ranges[i].rooms.triple),
            double: Math.ceil(ranges[i].rooms.double),
            total: Math.ceil(ranges[i].rooms.total)
        }
    }
    return ranges;
}

function getHotelRanges(hotel, range){
    let inventory = [createRangeCopy(range)];
    
    //Getting Inventory//
    let roomRanges = hotel.rooms.map((room)=>{
        return roomToRange(room);
    })

    inventory = mergeRangeArrays(inventory, roomRanges, addNewRange);

    //Getting Bookings//
    let booking = [createRangeCopy(range)];
    for(let i = 0;i<hotel.rooms.length; i++){
        let roomBookingRanges = roomBookingToRanges(hotel.rooms[i], range)
        booking = mergeRangeArrays(booking, roomBookingRanges, addNewRange);
    }

    //Getting Remaining Bookings//
    let remainingBooking = [createRangeCopy(range)];
    let remainingBookingRanges = hotel.remainingCustomerData.map((remainingCustomer)=>{
        return remainingBookingsToRange(
            remainingCustomer
        )
    });
    remainingBooking = mergeRangeArrays(remainingBooking, remainingBookingRanges, addNewRange);
    remainingBooking = ceilUpRanges(remainingBooking);
    
    //Getting All The Bookings//
    let allBooking = mergeRangeArrays(booking, remainingBooking, addNewRange)

    //Wastage Report//
    let wastage = mergeRangeArrays(inventory, allBooking, subNewRange)

    //Paid Wastage Report//
    let paidWastage = mergeRangeArrays(inventory, booking, subNewRange)

    //Now we can expand the ranges and get required data//
    inventory = expandDateRanges(inventory)

    booking = expandDateRanges(booking)
    remainingBooking = expandDateRanges(remainingBooking)
    allBooking = expandDateRanges(allBooking)
    wastage = expandDateRanges(wastage)
    paidWastage = expandDateRanges(paidWastage)
    
    return {
        inventory,
        booking,
        remainingBooking,
        allBooking,
        wastage,
        paidWastage
    }
}

function customerDataToRange(customerData, roomType){
    return {
        checkinDate: customerData.checkinDate,
        checkoutDate: customerData.checkoutDate,
        rooms:{
            quint: roomType == "Quint"?customerData.noOfBeds/5:0,
            quad: roomType == "Quad"?customerData.noOfBeds/4:0,
            triple: roomType == "Triple"?customerData.noOfBeds/3:0,
            double: roomType == "Double"?customerData.noOfBeds/2:0,
            total: customerData.noOfBeds/roomTypesBeds[roomType]
        },
        beds:{
            quint: roomType == "Quint"?customerData.noOfBeds:0,
            quad: roomType == "Quad"?customerData.noOfBeds:0,
            triple: roomType == "Triple"?customerData.noOfBeds:0,
            double: roomType == "Double"?customerData.noOfBeds:0,
            total: customerData.noOfBeds
        }
    }
}

function remainingBookingsToRange(customerData){
    
    return {
        checkinDate: customerData.checkinDate,
        checkoutDate: customerData.checkoutDate,
        rooms:{
            quint: customerData.roomType == "Quint"?customerData.noOfBeds/5:0,
            quad: customerData.roomType == "Quad"?customerData.noOfBeds/4:0,
            triple: customerData.roomType == "Triple"?customerData.noOfBeds/3:0,
            double: customerData.roomType == "Double"?customerData.noOfBeds/2:0,
            total: customerData.noOfBeds/roomTypesBeds[customerData.roomType]
        },
        beds:{
            quint: customerData.roomType == "Quint"?customerData.noOfBeds:0,
            quad: customerData.roomType == "Quad"?customerData.noOfBeds:0,
            triple: customerData.roomType == "Triple"?customerData.noOfBeds:0,
            double: customerData.roomType == "Double"?customerData.noOfBeds:0,
            total: customerData.noOfBeds
        }
    }
}

module.exports = {getHotelRanges} 