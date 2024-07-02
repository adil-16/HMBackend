const Hotel = require("../models/hotel");
const User = require("../models/user");
const Voucher = require("../models/voucher");
const Ledger = require("../models/ledger");

const voucherController = {
  async createVoucher(req, res) {
    try {
      const {
        voucherNumber,
        customer,
        accommodations,
        confirmationStatus,
        tentativeHours,
        vatnumber,
        age,
        passportNumber,
        passengers,
        gender,
      } = req.body;

      // Validate tentativeHours
      if (confirmationStatus === "Tentative") {
        if (tentativeHours < 24 || tentativeHours > 120) {
          return res.status(400).send({ success: false, data: { error: "Tentative hours must be between 24 and 120." } });
        }
      }

      // Validate customer
      const customerRecord = await User.findById(customer);
      if (!customerRecord) {
        return res.status(404).send({ success: false, data: { error: "Customer not found" } });
      }

      // Validate accommodations and their hotels
      let totalAmount = 0;
      for (let accommodation of accommodations) {
        console.log("accomd", accommodation.hotel)
        const hotelRecord = await Hotel.findById(accommodation.hotel);
        if (!hotelRecord) {
          return res.status(404).send({ success: false, data: { error: `Hotel with id ${accommodation.hotel} not found` } });
        }

        // Calculate the total amount based on customerType
        const nights = Math.ceil((new Date(accommodation.checkout) - new Date(accommodation.checkin)) / (1000 * 60 * 60 * 24));
        if (customerRecord.customerType === 'b2b') {
          if (!accommodation.roomRate) {
            return res.status(400).send({ success: false, data: { error: "Room rate is required for b2b customers" } });
          }
          if (!accommodation.totalRooms) {
            return res.status(400).send({ success: false, data: { error: "Total rooms is required for b2b customers" } });
          }
          amount = accommodation.roomRate * accommodation.totalRooms * nights;
        } else { // Assuming customerType is 'guest'
          if (accommodation.roomType === "Shared") {
            if (!accommodation.bedRate) {
              return res.status(400).send({ success: false, data: { error: "Bed rate is required for shared rooms" } });
            }
            if (!accommodation.noOfBeds) {
              return res.status(400).send({ success: false, data: { error: "Number of beds is required for shared rooms" } });
            }
            amount = accommodation.bedRate * accommodation.noOfBeds * nights;
          } else {
            if (!accommodation.roomRate) {
              return res.status(400).send({ success: false, data: { error: "Room rate is required for non-shared rooms" } });
            }
            if (!accommodation.totalRooms) {
              return res.status(400).send({ success: false, data: { error: "Total rooms is required for non-shared rooms" } });
            }
            amount = accommodation.roomRate * accommodation.totalRooms * nights;
          }
        }
  
        totalAmount += amount;
      }

      // Create voucher
      const voucher = new Voucher({
        voucherNumber,
        customer,
        confirmationStatus,
        tentativeHours: confirmationStatus === "Tentative" ? tentativeHours : null,
        vatnumber,
        accommodations,
        age,
        passportNumber,
        passengers,
        gender,
      });

      const savedVoucher = await voucher.save();

      // Update ledger for customer and cash
      let customerLedger = await Ledger.findOne({ cusId: customer, role: "customer" });
      let cashLedger = await Ledger.findOne({ role: "cash" });

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
          role: "customer",
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
          role: "cash",
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
      return res.status(500).send({ success: false, data: { error: error.message } });
    }
  },
  async getFilteredVouchers(req, res) {
    try {
      const {
        reportType,
        fromDate,
        toDate,
        hotelId,
        confirmationStatus,
        duration,
        customerId,
      } = req.query;

      // Validate the input
      if (!reportType || !hotelId || !confirmationStatus) {
        return res
          .status(400)
          .send({
            success: false,
            data: { error: "Missing required query parameters" },
          });
      }

      let from, to;

      // Determine the date range based on the duration
      const today = new Date();
      if (duration === "Today") {
        from = new Date(today.setHours(0, 0, 0, 0));
        to = new Date(today.setHours(23, 59, 59, 999));
      } else if (duration === "Tomorrow") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        from = new Date(tomorrow.setHours(0, 0, 0, 0));
        to = new Date(tomorrow.setHours(23, 59, 59, 999));
      } else if (duration === "Custom") {
        if (!fromDate || !toDate) {
          return res
            .status(400)
            .send({
              success: false,
              data: { error: "Missing required query parameters" },
            });
        }
        from = new Date(fromDate);
        to = new Date(toDate);
      } else {
        return res
          .status(400)
          .send({
            success: false,
            data: { error: "Invalid duration selected" },
          });
      }

      // Determine the filter field based on the reportType
      let dateFilterField;
      if (reportType === "Arrival Intimation") {
        dateFilterField = "accommodations.checkin";
      } else if (reportType === "Departure Intimation") {
        dateFilterField = "accommodations.checkout";
      } else {
        return res
          .status(400)
          .send({ success: false, data: { error: "Invalid report type" } });
      }

      let confirmationStatusQuery;
      if (confirmationStatus === "Both") {
        confirmationStatusQuery = { $in: ["Tentative", "Confirmed"] };
      } else {
        confirmationStatusQuery = confirmationStatus;
      }

      // Build the query
      let query = {
        confirmationStatus: confirmationStatusQuery,
        "accommodations.hotel": hotelId,
        [dateFilterField]: { $gte: from, $lte: to },
      };
      // Add customer filter if customerId is provided
      if (customerId) {
        query["customer"] = customerId;
      }

      // Find vouchers matching the criteria
      const vouchers = await Voucher.find(query).populate("customer");

      if (!vouchers.length) {
        return res
          .status(404)
          .send({
            success: false,
            data: { error: "No vouchers found matching the criteria" },
          });
      }

      // Helper function to classify the ages
      const getPaxType = (age) => {
        if (age >= 0 && age <= 2) return "infant";
        if (age >= 3 && age <= 12) return "child";
        if (age > 12) return "adult";
        return "unknown";
      };

      // Iterate through vouchers to classify and count ages
      vouchers.forEach((voucher) => {
        let adultCount = 0;
        let childCount = 0;
        let infantCount = 0;

        const customerAge = voucher.customer.age;
        if (customerAge !== undefined) {
          const customerType = getPaxType(customerAge);
          if (customerType === "adult") adultCount++;
          if (customerType === "child") childCount++;
          if (customerType === "infant") infantCount++;
        }

        if (
          voucher.customer.passengers &&
          Array.isArray(voucher.customer.passengers)
        ) {
          voucher.customer.passengers.forEach((passenger) => {
            const passengerAge = passenger.age;
            if (passengerAge !== undefined) {
              const passengerType = getPaxType(passengerAge);
              if (passengerType === "adult") adultCount++;
              if (passengerType === "child") childCount++;
              if (passengerType === "infant") infantCount++;
            }
          });
        }

        voucher.paxCounts = { adultCount, childCount, infantCount };
      });

      const paxCounts = vouchers.reduce(
        (acc, voucher) => {
          acc.adultCount += voucher.paxCounts.adultCount;
          acc.childCount += voucher.paxCounts.childCount;
          acc.infantCount += voucher.paxCounts.infantCount;
          return acc;
        },
        { adultCount: 0, childCount: 0, infantCount: 0 }
      );

      return res
        .status(200)
        .send({ success: true, data: { vouchers, paxCounts } });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .send({ success: false, data: { error: "Server Error" } });
    }
  },

  async getVoucher(req, res) {
    try {
      const voucherId = req.params.id;
      const voucher = await Voucher.findById(voucherId)
        .populate("customer")
        .populate({
          path: "accommodations.hotel",
          model: "hotel",
        });
      if (!voucher) {
        return res
          .status(404)
          .send({ success: false, data: { error: "Voucher not found" } });
      }

      return res.status(200).send({ success: true, data: { voucher } });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .send({ success: false, data: { error: "Server Error" } });
    }
  },

  async getAllVouchers(req, res) {
    try {
      const vouchers = await Voucher.find().populate("customer");
      if (!vouchers.length) {
        return res
          .status(404)
          .send({ success: false, data: { error: "No vouchers found" } });
      }

      return res.status(200).send({ success: true, data: { vouchers } });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .send({ success: false, data: { error: "Server Error" } });
    }
  },
};

module.exports = voucherController;
