
//HotelRecord = Hotel Object && Accomodation = 
// {
//   "checkin": 1,
//   "checkout": 2,
//   "roomType": "quint", "quad", "triple", "duo",
//   "bookingType": "bed", "room"
// }
let testHotelRecord = {
    _id: "66b2944f9d50223f54b4856e",
    name: "Sarina",
    location: "Islamabad",
    totalRooms: 6,
    rooms: [
        {
            _id: "66b294879d50223f54b48580",
            checkinDate: new Date("2024-08-07T00:00:00.000Z"),
            checkoutDate: new Date("2024-10-08T00:00:00.000Z"),
            roomType: "Quint",
            roomNumber: "2",
            totalBeds: 5,
            customersData: [
                {
                    _id: "66b294dc9d50223f54b485a2",
                    voucherId: "66b294dc9d50223f54b4859f",
                    checkinDate: new Date("2024-08-07T00:00:00.000Z"),
                    checkoutDate: new Date("2024-09-04T00:00:00.000Z"),
                    noOfBeds: 5,
                    bedRate: 100
                },
                {
                    _id: "66b298f22dca081438f0b3cf",
                    voucherId: "66b298f22dca081438f0b3cc",
                    checkinDate: new Date("2024-09-05T00:00:00.000Z"),
                    checkoutDate: new Date("2024-10-01T00:00:00.000Z"),
                    noOfBeds: 5,
                    bedRate: 100
                }
            ]
        },
        {
            _id: "66b294879d50223f54b48586",
            checkinDate: new Date("2024-08-07T00:00:00.000Z"),
            checkoutDate: new Date("2024-10-08T00:00:00.000Z"),
            roomType: "Quint",
            roomNumber: "3",
            totalBeds: 5,
            customersData: [
                {
                    _id: "66b294dc9d50223f54b485a3",
                    voucherId: "66b294dc9d50223f54b4859f",
                    checkinDate: new Date("2024-08-07T00:00:00.000Z"),
                    noOfBeds: 5,
                    checkoutDate: new Date("2024-09-04T00:00:00.000Z"),
                    bedRate: 100
                },
                {
                    _id: "66b294dc9d50223f54b485a333",
                    voucherId: "66b294dc9d50223f5432339f",
                    noOfBeds: 3,
                    checkinDate: new Date("2024-09-05T00:00:00.000Z"),
                    checkoutDate: new Date("2024-09-09T00:00:00.000Z"),
                    bedRate: 100
                },
                {
                    _id: "66b299302dca081438f0b3ef",
                    voucherId: "66b2992f2dca081438f0b3ec",
                    checkinDate: new Date("2024-09-10T00:00:00.000Z"),
                    checkoutDate: new Date("2024-10-04T00:00:00.000Z"),
                    noOfBeds: 5,
                    bedRate: 120
                }
            ]
        },
        {
            _id: "66b315c518471014e0819cc1",
            checkinDate: new Date("2024-08-07T00:00:00.000Z"),
            checkoutDate: new Date("2024-10-07T00:00:00.000Z"),
            roomType: "Quint",
            roomNumber: "4",
            totalBeds: 5,
            customersData: [
                {
                    _id: "66b342a67d169635b4e87f75",
                    voucherId: "66b342a67d169635b4e87f72",
                    checkinDate: new Date("2024-09-04T00:00:00.000Z"),
                    checkoutDate: new Date("2024-10-04T00:00:00.000Z"),
                    noOfBeds: 5,
                    bedRate: 120
                }
            ]
        },
        {
            _id: "66b315c518471014e0819ccd",
            checkinDate: new Date("2024-08-07T00:00:00.000Z"),
            checkoutDate: new Date("2024-10-07T00:00:00.000Z"),
            roomType: "Quint",
            roomNumber: "6",
            totalBeds: 5,
            customersData: []
        },
        {
            _id: "66b315c518471014e0819cd3",
            checkinDate: new Date("2024-08-07T00:00:00.000Z"),
            checkoutDate: new Date("2024-10-07T00:00:00.000Z"),
            roomType: "Quint",
            roomNumber: "7",
            totalBeds: 5,
            customersData: []
        }
    ],
    __v: 6,
    image: null,
    availableRoomsCount: 3,
    bookedRoomsCount: 4
}
let testAccomodation = {
    roomType: "Quint",
    bookingType: "bed",
    checkin: new Date("2024-09-05T00:00:00.000Z"),
    checkout: new Date("2024-09-10T00:00:00.000Z")
}