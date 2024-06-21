const Hotel = require("../models/hotel");
const User = require("../models/user");
const Voucher = require("../models/voucher");

const voucherController = {
  async createVoucher(req, res) {
    try {
      const { hotel, customer, accommodations } = req.body;

      const hotelRecord = await Hotel.findById(hotel);
      if (!hotelRecord) {
        return res.status(404).send({ success: false, data: { error: "Hotel not found" } });
      }

      const customerRecord = await User.findById(customer);
      if (!customerRecord) {
        return res.status(404).send({ success: false, data: { error: "Customer not found" } });
      }

      const voucher = new Voucher({
        hotel,
        customer,
        accommodations,
      });

      const savedVoucher = await voucher.save();

      return res.status(201).send({
        success: true,
        data: {
          message: "Voucher created successfully",
          voucher: savedVoucher,
          hotel: hotelRecord,
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
      const voucher = await Voucher.findById(voucherId).populate("hotel").populate("customer");
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
