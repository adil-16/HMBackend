
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

function getAvailability(roomObj){
    let dateRanges = [{
        "checkinDate": roomObj["checkinDate"],
        "checkoutDate": roomObj["checkoutDate"],
        "noOfBeds": roomObj["totalBeds"]
    }]

    for(let i = 0; i<roomObj["bookings"].length; i++){
        let booking = roomObj["bookings"][i];
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