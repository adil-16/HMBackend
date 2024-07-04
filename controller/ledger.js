const Ledger = require("../models/ledger");

const ledgerController = {
  createLedger: async (req, res) => {
    try {
      const {
        title,
        debit,
        credit,
        role,
        supId,
        cusId,
        bankId,
        balance,
        hotelId,
        conversionRate = 1,
      } = req.body;
      if (
        !title ||
        !credit ||
        !role ||
        !balance ||
        (!supId && !cusId && !bankId)
      ) {
        throw new Error("Please Enter All Required Fields!");
      }

      const idField = supId ? "supId" : cusId ? "cusId" : "bankId";
      const idValue = supId || cusId || bankId;

      let ledger = await Ledger.findOne({ [idField]: idValue });
      const newEntry = {
        title,
        debit: debit || 0,
        credit,
        balance,
        conversionRate,
      };

      if (ledger) {
        ledger.entries.push(newEntry);
        let totalBalance = ledger.entries.reduce((acc, entry) => {
          return acc + entry.balance;
        }, 0);
        ledger.totalBalance = totalBalance;
      } else {
        ledger = new Ledger({
          [idField]: idValue,
          hotelId,
          role,
          entries: [newEntry],
        });
      }

      await ledger.save();

      res.status(201).json({ message: "Ledger updated successfully!", ledger });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  getLedger: async (req, res) => {
    try {
      const { supplierId, customerId, bankId, hotelId, currency } = req.query;
      if ((!supplierId && !customerId && !bankId) || !hotelId) {
        return res
          .status(400)
          .json({ message: "Missing required query parameters." });
      }

      const idField = supplierId ? "supId" : customerId ? "cusId" : "bankId";
      const idValue = supplierId || customerId || bankId;

      const ledger = await Ledger.findOne({
        [idField]: idValue,
        hotelId: hotelId,
      });

      if (ledger) {
        if (currency === "PKR") {
          ledger.entries = ledger.entries.map((entry) => ({
            ...entry.toObject(),
            debit: entry.debit * entry.conversionRate,
            credit: entry.credit * entry.conversionRate,
            balance: entry.balance * entry.conversionRate,
          }));
        }
        res.status(200).json({ message: "Ledger found.", ledger });
      } else {
        res.status(404).json({ message: "Ledger not found." });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching the ledger." });
    }
  },

  filterLedger: async (req, res) => {
    try {
      const { id } = req.params;
      const { from, to, currency } = req.query;

      if (!id || !from || !to) {
        return res.status(400).json({ message: "Missing required params." });
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);

      const filteredLedgers = await Ledger.find({
        $or: [{ supId: id }, { cusId: id }, { bankId: id }],
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      });

      if (currency === "PKR") {
        filteredLedgers.forEach((ledger) => {
          ledger.entries = ledger.entries.map((entry) => ({
            ...entry.toObject(),
            debit: entry.debit * entry.conversionRate,
            credit: entry.credit * entry.conversionRate,
            balance: entry.balance * entry.conversionRate,
          }));

          // Calculate total balance in PKR for each ledger
          ledger.totalBalance = ledger.entries.reduce((acc, entry) => {
            return acc + entry.balance;
          }, 0);
        });
      }

      res.status(200).json({
        message: "Filtered ledgers successfully.",
        ledgers: filteredLedgers,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching the ledgers..." });
    }
  },

  filterAdminLedger: async (req, res) => {
    try {
      const { from, to, currency } = req.query;

      if (!from || !to) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);

      const filteredLedgers = await Ledger.find({
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      });

      if (currency === "PKR") {
        filteredLedgers.forEach((ledger) => {
          ledger.entries = ledger.entries.map((entry) => ({
            ...entry.toObject(),
            debit: entry.debit * entry.conversionRate,
            credit: entry.credit * entry.conversionRate,
            balance: entry.balance * entry.conversionRate,
          }));

          // Calculate total balance in PKR for each ledger
          ledger.totalBalance = ledger.entries.reduce((acc, entry) => {
            return acc + entry.balance;
          }, 0);
        });
      }

      res.status(200).json({
        message: "Filtered ledgers successfully.",
        ledgers: filteredLedgers,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching the ledgers..." });
    }
  },

  updateCurrencyRate: async (req, res) => {
    try {
      const { rate } = req.body;

      if (!rate) {
        return res.status(400).json({ message: "Rate is required." });
      }

      // Update all ledger entries with the new conversion rate
      await Ledger.updateMany(
        {},
        { $set: { "entries.$[].conversionRate": rate } }
      );

      res.status(200).json({ message: "Currency rate updated successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "An error occurred while updating the currency rate.",
      });
    }
  },

  getAdminLedger: async (req, res) => {
    try {
      const { role, to, from, currency } = req.query;
      if (!role) {
        return res
          .status(400)
          .json({ message: "Missing required role parameter." });
      }

      if (role && to && from) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const filteredLedgers = await Ledger.find({
          role,
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
        });

        if (currency === "PKR") {
          filteredLedgers.forEach((ledger) => {
            ledger.entries = ledger.entries.map((entry) => ({
              ...entry.toObject(),
              debit: entry.debit * entry.conversionRate,
              credit: entry.credit * entry.conversionRate,
              balance: entry.balance * entry.conversionRate,
            }));
          });
        }

        res.status(200).json({
          message: "Filtered ledgers successfully.",
          ledgers: filteredLedgers,
        });
      } else {
        const ledgers = await Ledger.find({ role });

        if (currency === "PKR") {
          ledgers.forEach((ledger) => {
            ledger.entries = ledger.entries.map((entry) => ({
              ...entry.toObject(),
              debit: entry.debit * entry.conversionRate,
              credit: entry.credit * entry.conversionRate,
              balance: entry.balance * entry.conversionRate,
            }));
          });
        }

        res
          .status(200)
          .json({ message: "Admin ledgers fetched successfully.", ledgers });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching the ledgers." });
    }
  },
};

module.exports = ledgerController;
