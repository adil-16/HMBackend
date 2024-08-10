const Hotel = require("../models/hotel");
const User = require("../models/user");
const Voucher = require("../models/voucher");
const Ledger = require("../models/ledger");



const voucherServices = {
    async createVoucher(voucherNumber,customer,accommodations,confirmationStatus,tentativeHours,vatnumber,passengers,bankId,paymentMethod){
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

module.exports = voucherServices;