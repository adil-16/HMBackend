const Poform = require("../models/poform");
const User = require("../models/user");
const Hotel = require("../models/hotel");
const Ledger=require("../models/ledger")
const poformController = {
  async createPoform(req, res) {
    const { supplierID, hotelID, checkin, checkout, rooms, bedRates,debit,credit,role } = req.body;
    console.log(checkin,checkout)
    try {
      

      // Validate input
      if (!supplierID || !hotelID || !checkin || !checkout || !rooms || !bedRates) {
        return res.status(400).send({ success: false, data: { error: "Invalid input" } });
      }

      // Calculate the number of nights
      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

      // Room bed count mapping
      const roomBedCount = {
        shared: 5,
        quad: 4,
        triple: 3,
        double: 2,
      };

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
            let ledger=await Ledger.findOne({role})
            const newEntry={
                title:"Cash",
                debit,
                credit:0,
                role:"cash",
                balance:(debit - credit)
              }
              if (ledger) {
                ledger.entries.push(newEntry);
                 totalBalance=ledger.entries.reduce((acc,entr)=>{
                      return acc + entr.balance
                },0)
                ledger.totalBalance=totalBalance
              } else {
                ledger = new Ledger({
                  hotelId:hotelID,
                  role:"cash",
                  entries: [newEntry],
                  totalBalance:(debit-credit),
                  title:"Cash",
                  balance:debit - credit
                });
              }
              const ledgersaved=await ledger.save();
            
    
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
