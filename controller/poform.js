const Poform = require("../models/poform");
const User = require("../models/user");
const Hotel = require("../models/hotel");
const Ledger = require("../models/ledger");
const hotelServices = require("../services/hotel");
const poformController = {
  async createPoform(req, res) {
    const {
      supplierID,
      hotelID,
      checkin,
      checkout,
      rooms,
      bedRates,
      debit,
      credit,
      role,
      roomDetails
    } = req.body;
    try {
      // Validate input
      if (
        !supplierID ||
        !hotelID ||
        !checkin ||
        !checkout ||
        !rooms ||
        !bedRates ||
        !roomDetails
      ) {
        return res
          .status(400)
          .send({ success: false, data: { error: "Invalid input" } });
      }
      // Calculate the number of nights
      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      
      //Adding Rooms in Hotel
      let newRooms = await hotelServices.addHotelRooms(hotelID, roomDetails, checkinDate, checkoutDate);

      const nights = Math.ceil(
        (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)
      );
      // Room bed count mapping
      const bedCounts = { quint: 5, quad: 4, triple: 3, double: 2 };
      const roomBedCount = Object.entries(rooms).reduce((acc, [key, value]) => {
        if (value && value !== "0") {
          acc[key] = bedCounts[key];
        }
        return acc;
      }, {});
      // Calculate total payable for each room type
      let totalPayable = 0;
      let roomPayables = {};

      for (const roomType in rooms) {
        const roomCount = rooms[roomType];
        const bedRate = bedRates[roomType];
        const bedCount = roomBedCount[roomType];
        const roomPayable = roomCount * bedRate * bedCount * nights;
        totalPayable += roomPayable;
        roomPayables[roomType] = roomPayable;
      }

      // Create new Poform document
      const newPoform = new Poform({
        supplierID,
        hotelID,
        checkin,
        checkout,
        rooms,
        bedRates,
      });

      await newPoform.save();

      let totalBalance;
      try {
        let ledger = await Ledger.findOne({ role });
        const newEntry = {
          title: "Cash",
          debit,
          credit: 0,
          role: "cash",
          balance: debit - credit,
        };
        if (ledger) {
          ledger.entries.push(newEntry);
          totalBalance = ledger.entries.reduce((acc, entr) => {
            return acc + entr.balance;
          }, 0);
          ledger.totalBalance = totalBalance;
        } else {
          ledger = new Ledger({
            hotelId: hotelID,
            role: "cash",
            entries: [newEntry],
            totalBalance: debit - credit,
            title: "Cash",
            balance: debit - credit,
          });
        }
        const ledgersaved = await ledger.save();
      } catch (error) {
        console.error(error);
      }

      return res.status(200).send({
        success: true,
        data: {
          message: "Poform created successfully",
          poform: newPoform,
          roomPayables,
          totalPayable,
          nights,
        },
      });
    } catch (error) {
      console.error("Error creating Poform:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
};

module.exports = poformController;
