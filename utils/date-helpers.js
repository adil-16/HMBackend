function dateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let datesRange = [];
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        datesRange.push(new Date(date));
    }
    return datesRange
}

function getDayName(date) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayIndex = date.getDay(); // getDay() returns a number from 0 to 6
    return daysOfWeek[dayIndex];
}

module.exports = {dateRange, getDayName}