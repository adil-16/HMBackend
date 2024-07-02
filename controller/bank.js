const Bank = require("../models/bank");
// Create a new bank
exports.createBank = async (req, res) => {
  try {
    const newBank = new Bank(req.body);
    const savedBank = await newBank.save();
    res.status(201).json(savedBank);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all banks
exports.getAllBanks = async (req, res) => {
  try {
    const banks = await Bank.find();
    res.status(200).json(banks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single bank by ID
exports.getBankById = async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ message: "Bank not found" });
    }
    res.status(200).json(bank);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a bank by ID
exports.updateBank = async (req, res) => {
  try {
    const updatedBank = await Bank.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedBank) {
      return res.status(404).json({ message: "Bank not found" });
    }
    res.status(200).json(updatedBank);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a bank by ID
exports.deleteBank = async (req, res) => {
  try {
    const deletedBank = await Bank.findByIdAndDelete(req.params.id);
    if (!deletedBank) {
      return res.status(404).json({ message: "Bank not found" });
    }
    res.status(200).json({ message: "Bank deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
