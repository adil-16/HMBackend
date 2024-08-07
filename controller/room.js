const Hotel = require("../models/hotel");
const roomServices = require("../services/room");

const roomController = {
    async getRoomLedger(req, res){
        let hotelId = req.params.hotelId;
        let roomId = req.params.roomId

        let roomData = await roomServices.getRoomLedger(hotelId, roomId)

        return res.status(200).send({...roomData})
    }
}

module.exports = roomController
