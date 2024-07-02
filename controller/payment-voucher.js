const Ledger = require("../models/ledger");

const paymentVoucherController = {
  debitpayment: async (req, res) => {
    try {
      const { title, amount, supId, role, paymentMethod, bankId } = req.body;
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
        ledger = new Ledger({
          supId,
          role: "supplier",
          entries: [newEntry],
        });
      }

      await ledger.save();

      if (paymentMethod === "cash" && role == "cash") {
        try {
          let cashLedger = await Ledger.findOne({ role: "cash" });
          const cashEntry = {
            title: "Rooms",
            debit: 0,
            credit: amount,
            balance: 0 - amount,
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
        } catch (error) {
          console.error("Failed to update Cash Ledger", error);
          return res.status(500).json({
            message: "Failed to update Cash Ledger: " + error.message,
          });
        }
      } else if (paymentMethod === "bank" && bankId && role == "bank") {
        try {
          let bankLedger = await Ledger.findOne({ bankId, role: "bank" });
          const bankEntry = {
            title: "Booking Rooms",
            debit: amount,
            credit: 0,
            balance: amount,
          };
          if (bankLedger) {
            bankLedger.entries.push(bankEntry);
            let totalBalance = bankLedger.entries.reduce((acc, entr) => {
              return acc + entr.balance;
            }, 0);
            bankLedger.totalBalance = totalBalance;
          } else {
            bankLedger = new Ledger({
              bankId,
              entries: [bankEntry],
            });
          }
          await bankLedger.save();
        } catch (error) {
          console.error("Failed to update Bank Ledger", error);
          return res.status(500).json({
            message: "Failed to update Bank Ledger: " + error.message,
          });
        }
      }

      res
        .status(201)
        .json({ message: "Ledgers updated successfully!", ledger });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  debitReceipt: async (req, res) => {
    try {
      const { title, amount, cusId, role, paymentMethod, bankId } = req.body;
      if (!title || !cusId || !amount) {
        throw new Error("Please Enter All Required Fields!");
      }

      // Update customer ledger
      let ledger = await Ledger.findOne({ cusId });
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
          entries: [newEntry],
        });
      }

      await ledger.save();

      // Update cash ledger
      if (paymentMethod === "cash") {
        try {
          let cashLedger = await Ledger.findOne({ role: "cash" });
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
        } catch (error) {
          console.error("Failed to update Cash Ledger", error);
          return res.status(500).json({
            message: "Failed to update Cash Ledger: " + error.message,
          });
        }
      } else if (paymentMethod === "bank" && bankId) {
        // Update bank ledger
        try {
          let bankLedger = await Ledger.findOne({ bankId });
          const bankEntry = {
            title: "Booking Rooms",
            debit: amount,
            credit: 0,
            balance: amount,
          };
          if (bankLedger) {
            bankLedger.entries.push(bankEntry);
            let totalBalance = bankLedger.entries.reduce((acc, entr) => {
              return acc + entr.balance;
            }, 0);
            bankLedger.totalBalance = totalBalance;
          } else {
            bankLedger = new Ledger({
              bankId,
              entries: [bankEntry],
            });
          }
          await bankLedger.save();
        } catch (error) {
          console.error("Failed to update Bank Ledger", error);
          return res.status(500).json({
            message: "Failed to update Bank Ledger: " + error.message,
          });
        }
      }

      res
        .status(201)
        .json({ message: "Ledgers updated successfully!", ledger });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = paymentVoucherController;
