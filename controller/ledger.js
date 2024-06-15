const Ledger = require('../models/ledger'); 

const ledgerController = {
  createLedger: async (req, res) => {
    try {
      const {title, debit, credit, role, supId, balance,hotelId } = req.body;
      if (!title || !credit || !role || !supId || !balance) {
        throw new Error("Please Enter All Required Fields!");
      }
      if(role=="cash"){
        try {
            let ledger=await Ledger.findOne({role:"cash"})
            const newEntry={
                title,
                debit:credit,
                credit:0,
                balance,
              }
              if (ledger) {
                ledger.entries.push(newEntry);
                let totalBalance=ledger.entries.reduce((acc,entr)=>{
                      return acc + entr.balance
                },0)
                ledger.totalBalance=totalBalance
              } else {
                  ledger = new Ledger({
                  hotelId,
                  role,
                  entries: [newEntry],
                  totalBalance
                });
              }
              await ledger.save();
        
              res.status(201).json({ message: "Ledger updated successfully!", ledger });

    
        } catch (error) {
            console.error(error);
         res.status(500).json({ message: error.message });

        }
          
      }

      let ledger = await Ledger.findOne({ supId });
      const newEntry = {
        title,
        debit:debit || 0,
        credit,
        balance,
      };

      if (ledger) {
        ledger.entries.push(newEntry);
        let totalBalance=ledger.entries.reduce((acc,entr)=>{
              return acc + entr.balance
        },0)
        ledger.totalBalance=totalBalance
      } else {
        ledger = new Ledger({
          supId,
          hotelId,
          role,
          entries: [newEntry]
        });
      }

      await ledger.save();

      res.status(201).json({ message: "Ledger updated successfully!", ledger });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
  filterLedger:async (req, res) => {
    try {
      const { id } = req.params;
      const { from, to } = req.query;
  
      if (!id || !from || !to) {
        return res.status(400).json({ message: 'missing required params.' });
      }
  
      const fromDate = new Date(from);
      const toDate = new Date(to);
  
      const filteredLedgers = await Ledger.find({
        supId: id,
        createdAt: {
          $gte: fromDate,
          $lte: toDate
        }
      });
  
      res.status(200).json({ message: 'Filtered ledgers successfully.', ledgers: filteredLedgers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while fetching the ledgers...' });
    }
},
   getAdminLedger:async(req,res)=>{
    try {
        const { role } = req.query;
    
        if (!role) {
          return res.status(400).json({ message: 'Missing required role parameter.' });
        }
        const ledgers = await Ledger.find({ role });
    
        res.status(200).json({ message: 'Admin ledgers fetched successfully.', ledgers });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the ledgers.' });
      }
}
};

module.exports = ledgerController;
