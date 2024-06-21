const Hotel = require("../models/hotel");
const User = require("../models/user");
const Voucher = require("../models/voucher");

const voucherController = {
  async createVoucher(req, res) {
    try {
      const { customer, accommodations } = req.body;

      // Validate customer
      const customerRecord = await User.findById(customer);
      if (!customerRecord) {
        return res.status(404).send({ success: false, data: { error: "Customer not found" } });
      }

      // Validate accommodations and their hotels
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
      }

      const voucher = new Voucher({
        customer,
        accommodations,
      });

      const savedVoucher = await voucher.save();

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
