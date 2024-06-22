const Ledger = require("../models/ledger");
const paymentVoucherController = {
  debitpayment: async (req, res) => {
    try {
      const { title, amount, supId, role } = req.body;
      if (!title || !supId || !amount) {
        throw new Error("Please Enter All Required Fields!");
      }

      let ledger = await Ledger.findOne({ supId });
      const newEntry = {
        title,
        debit: amount,
        credit: 0,
        balance: amount - 0,
      };

      if (ledger) {
        ledger.entries.push(newEntry);
        let totalBalance = ledger.entries.reduce((acc, entr) => {
          return acc + entr.balance;
        }, 0);
        ledger.totalBalance = totalBalance;
      } else {
        ledger = new paymentVoucher({
          supId,
          entries: [newEntry],
        });
      }

      await ledger.save();
      if (role == "cash") {
        try {
          let ledger = await Ledger.findOne({ role });
          const newEntry = {
            title: "Rooms",
            debit: 0,
            credit: amount,
            balance: 0 - amount,
          };
          if (ledger) {
            ledger.entries.push(newEntry);
            let totalBalance = ledger.entries.reduce((acc, entr) => {
              return acc + entr.balance;
            }, 0);
            ledger.totalBalance = totalBalance;
          } else {
            ledger = new paymentVoucher({
              supId,
              entries: [newEntry],
            });
          }

          await ledger.save();
        } catch (error) {
          console.error("Failed to updated Cash Ledger", error);
          res.status(500).json({ message: error.message });
        }
      }

      res.status(201).json({ message: "Ledger updated successfully!", ledger });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
  debitReceipt: async (req, res) => {
    try {
      const { title, amount, cusId, role } = req.body;
      if (!title || !cusId || !amount) {
        throw new Error("Please Enter All Required Fields!");
      }

      // Log the received payload
      console.log("Received payload:", { title, amount, cusId, role });

      // Update customer ledger
      let ledger = await Ledger.findOne({ cusId });
      console.log("Found customerLedger:", ledger);

      const newEntry = {
        title,
        debit: 0,
        credit: amount,
        balance: 0 - amount,
      };

      if (ledger) {
        ledger.entries.push(newEntry);
        let totalBalance = ledger.entries.reduce((acc, entr) => {
          return acc + entr.balance;
        }, 0);
        ledger.totalBalance = totalBalance;
      } else {
        ledger = new Ledger({
          cusId,
          role: "customer",
          entries: [customerEntry],
        });
      }

      await ledger.save();
      console.log("Updated customerLedger:", ledger);

      // Update cash ledger
      let cashLedger;
      if (role === "cash") {
        try {
          cashLedger = await Ledger.findOne({ role: "cash" });
          console.log("Found cashLedger:", cashLedger);

          const cashEntry = {
            title: "Booking Rooms",
            debit: amount,
            credit: 0,
            balance: amount,
          };

          if (cashLedger) {
            cashLedger.entries.push(cashEntry);
            let totalBalance = cashLedger.entries.reduce((acc, entr) => {
              return acc + entr.balance;
            }, 0);
            cashLedger.totalBalance = totalBalance;
          } else {
            cashLedger = new Ledger({
              role: "cash",
              entries: [cashEntry],
            });
          }

          await cashLedger.save();
          console.log("Updated cashLedger:", cashLedger);
        } catch (error) {
          console.error("Failed to update Cash Ledger", error);
          return res
            .status(500)
            .json({
              message: "Failed to update Cash Ledger: " + error.message,
            });
        }
      }

      res
        .status(201)
        .json({
          message: "Ledgers updated successfully!",
          ledger,
          cashLedger,
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = paymentVoucherController;
