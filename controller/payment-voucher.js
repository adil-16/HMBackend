const Ledger = require('../models/ledger'); 
const paymentVoucherController={
    debitpayment:async(req,res)=>{

        try {
            const {title, amount, supId,role } = req.body;
            if (!title ||  !supId || !amount) {
              throw new Error("Please Enter All Required Fields!");
            }
      
      
            let ledger = await Ledger.findOne({ supId });
            const newEntry = {
              title,
              debit:amount,
              credit:0,
              balance:amount-0
            };
      
            if (ledger) {
              ledger.entries.push(newEntry);
              let totalBalance=ledger.entries.reduce((acc,entr)=>{
                return acc + entr.balance
          },0)
          ledger.totalBalance=totalBalance
            } else {
              ledger = new paymentVoucher({
                supId,
                entries: [newEntry]
              });
            }
      
            await ledger.save();
              if(role=="cash"){
                try {
                    let ledger = await Ledger.findOne({ role });
                    const newEntry = {
                      title:"Rooms",
                      debit:0,
                      credit:amount,
                      balance:0-amount
                    };
                    if (ledger) {
                        ledger.entries.push(newEntry);
                        let totalBalance=ledger.entries.reduce((acc,entr)=>{
                            return acc + entr.balance
                      },0)
                      ledger.totalBalance=totalBalance
                      } else {
                        ledger = new paymentVoucher({
                          supId,
                          entries: [newEntry]
                        });
                      }
                
                      await ledger.save();
              
                } catch (error) {
                    console.error("Failed to updated Cash Ledger",error);
                    res.status(500).json({ message: error.message });
                }
              }
            
      
            res.status(201).json({ message: "Ledger updated successfully!", ledger });
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
          }

    }
}
module.exports=paymentVoucherController