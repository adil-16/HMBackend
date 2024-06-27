const Hotel = require("../models/hotel");
const User = require("../models/user");
const Voucher = require("../models/voucher");
const Ledger = require("../models/ledger");

const voucherController = {
  async createVoucher(req, res) {
    try {
      const { customer, accommodations, confirmationStatus, tentativeDate, confirmationType, vatnumber } = req.body;

      // Validate customer
      const customerRecord = await User.findById(customer);
      if (!customerRecord) {
        return res.status(404).send({ success: false, data: { error: "Customer not found" } });
      }

      // Validate accommodations and their hotels
      let totalAmount = 0;
      for (let accommodation of accommodations) {
        const hotelRecord = await Hotel.findById(accommodation.hotel);
        if (!hotelRecord) {
          return res.status(404).send({ success: false, data: { error: `Hotel with id ${accommodation.hotel} not found` } });
        }
        if (!accommodation.bedRate) {
          return res.status(400).send({ success: false, data: { error: "Bed rate is required" } });
        }
        if (accommodation.roomType === "Shared" && !accommodation.noOfBeds) {
          return res.status(400).send({ success: false, data: { error: "Number of beds is required for shared rooms" } });
        }
        // Calculate the total amount
        const nights = Math.ceil((new Date(accommodation.checkout) - new Date(accommodation.checkin)) / (1000 * 60 * 60 * 24));
        const amount = accommodation.bedRate * (accommodation.roomType === "Shared" ? accommodation.noOfBeds : 1) * nights;
        totalAmount += amount;
      }

      // Create voucher
      const voucher = new Voucher({
        customer,
        confirmationStatus,
        tentativeDate: confirmationStatus === "Tentative" ? tentativeDate : null,
        confirmationType,
        vatnumber,
        accommodations,
      });

      const savedVoucher = await voucher.save();

      // Update ledger for customer and cash
      let customerLedger = await Ledger.findOne({ cusId: customer, role: 'customer' });
      let cashLedger = await Ledger.findOne({ role: 'cash' });

      const customerEntry = {
        title: "Booking",
        debit: totalAmount,
        credit: 0,
        balance: totalAmount,
      };

      const cashEntry = {
        title: "Booking",
        debit: 0,
        credit: totalAmount,
        balance: -totalAmount,
      };

      if (customerLedger) {
        customerLedger.entries.push(customerEntry);
        customerLedger.totalBalance += totalAmount;
      } else {
        customerLedger = new Ledger({
          cusId: customer,
          hotelId: accommodations[0].hotel,
          role: 'customer',
          entries: [customerEntry],
          totalBalance: totalAmount,
        });
      }

      if (cashLedger) {
        cashLedger.entries.push(cashEntry);
        cashLedger.totalBalance -= totalAmount;
      } else {
        cashLedger = new Ledger({
          hotelId: accommodations[0].hotel,
          role: 'cash',
          entries: [cashEntry],
          totalBalance: -totalAmount,
        });
      }

      await customerLedger.save();
      await cashLedger.save();

      return res.status(201).send({
        success: true,
        data: {
          message: "Voucher created successfully",
          voucher: savedVoucher,
          customer: customerRecord,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ success: false, data: { error: "Server Error" } });
    }
  },

  async getVoucher(req, res) {
    try {
      const voucherId = req.params.id;
      const voucher = await Voucher.findById(voucherId)
        .populate("customer")
        .populate({
          path: "accommodations.hotel",
          model: "hotel"
        });

      if (!voucher) {
        return res.status(404).send({ success: false, data: { error: "Voucher not found" } });
      }

      return res.status(200).send({ success: true, data: { voucher } });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ success: false, data: { error: "Server Error" } });
    }
  },
};

module.exports = voucherController;
