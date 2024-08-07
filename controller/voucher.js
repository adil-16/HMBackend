const Hotel = require("../models/hotel");
const User = require("../models/user");
const Voucher = require("../models/voucher");
const Ledger = require("../models/ledger");

function getAvailableRooms(hotelRecord, accommodation) {
  // Filter rooms based on accommodation's room type and date range
  const availableRooms = hotelRecord.rooms.filter((room) => {
    // Check if the room type matches
    if (room.roomType !== accommodation.roomType) {
      return false;
    }

    // Check if accommodation's dates fall within room's checkin and checkout dates
    if (
      accommodation.checkin < room.checkinDate ||
      accommodation.checkout > room.checkoutDate
    ) {
      return false;
    }

    // Check if accommodation's dates intersect with any of the customer's data dates
    const isIntersectingWithCustomerData = room.customersData.some((customer) => {
      return (
        (accommodation.checkin.getTime() == customer.checkoutDate.getTime()) || // Covering Edge Case
        (accommodation.checkin >= customer.checkinDate && accommodation.checkin < customer.checkoutDate) ||
        (accommodation.checkout > customer.checkinDate && accommodation.checkout <= customer.checkoutDate) ||
        (accommodation.checkin <= customer.checkinDate && accommodation.checkout >= customer.checkoutDate)
      );
    });

    // If there's an intersection with customer data, the room is not available
    return !isIntersectingWithCustomerData;
  });

  // Return the number of available rooms
  return availableRooms;
}

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
        passengers,
        bankId,
        paymentMethod,
      } = req.body;

      // Validate tentativeHours
      if (confirmationStatus === "Tentative") {
        if (tentativeHours < 24 || tentativeHours > 120) {
          return res.status(400).send({
            success: false,
            data: { error: "Tentative hours must be between 24 and 120." },
          });
        }
      }

      // Validate customer
      const customerRecord = await User.findById(customer);
      if (!customerRecord) {
        return res
          .status(404)
          .send({ success: false, data: { error: "Customer not found" } });
      }

      // Validate accommodations and their hotels
      let totalAmount = 0;
      for (let accommodation of accommodations) {
        accommodation.checkin = new Date(accommodation.checkin)
        accommodation.checkout = new Date(accommodation.checkout)
        const hotelRecord = await Hotel.findById(accommodation.hotel);
        if (!hotelRecord) {
          return res.status(404).send({
            success: false,
            data: { error: `Hotel with id ${accommodation.hotel} not found` },
          });
        }

        // Calculate the total amount based on customerType
        const nights = Math.ceil(
          (new Date(accommodation.checkout) - new Date(accommodation.checkin)) /
            (1000 * 60 * 60 * 24)
        );
        if (customerRecord) {
          if (!accommodation.roomRate) {
            return res.status(400).send({
              success: false,
              data: { error: "Room rate is required for b2b customers" },
            });
          }
          if (!accommodation.totalRooms) {
            return res.status(400).send({
              success: false,
              data: { error: "Total rooms is required for b2b customers" },
            });
          }
          amount = accommodation.roomRate * accommodation.totalRooms * nights;
        } else {
          if (!accommodation.roomRate) {
            return res.status(400).send({
              success: false,
              data: { error: "Room rate is required for non-shared rooms" },
            });
          }
          if (!accommodation.totalRooms) {
            return res.status(400).send({
              success: false,
              data: { error: "Total rooms is required for non-shared rooms" },
            });
          }
          amount = accommodation.roomRate * accommodation.totalRooms * nights;
        }

        totalAmount += amount;

        //Also Checking if room is booked or not for that date.
        let availableRooms = getAvailableRooms(hotelRecord, accommodation)

        if (accommodation.totalRooms > availableRooms.length) {
          return res.status(400).send({
            success: false,
            data: {
              error: `Not enough ${accommodation.roomType} rooms available`,
            },
          });
        }

         accommodation.rooms = availableRooms;
         accommodation.hotelRecord = hotelRecord;
      }

      // Create voucher
      const voucher = new Voucher({
        voucherNumber,
        customer,
        confirmationStatus,
        tentativeHours:
          confirmationStatus === "Tentative" ? tentativeHours : null,
        vatnumber,
        accommodations,
        passengers,
      });


      for(let accommodation of accommodations){
        let hotelRecord = await Hotel.findById(accommodation.hotel);
        let roomsAdded = [];
        for(let i = 0; i<accommodation.totalRooms; i++){
            console.log(accommodation.rooms[i])
            let room = accommodation.rooms[i];
            if (!room.beds.some((bed) => bed.isBooked)) {
              room.beds.forEach((bed) => {
                bed.isBooked = true;
                bed.Booking = {
                  from: accommodation.checkin,
                  to: accommodation.checkout,
                };
                bed.customer = customer;
              });
            }
            room.customersData.push({
              voucherId: voucher._id,
              checkinDate: accommodation.checkin,
              checkoutDate: accommodation.checkout,
              roomRate: accommodation.roomRate
            })
            roomsAdded.push(room);
            console.log(roomsAdded);
            
          }
        hotelRecord.rooms = hotelRecord.rooms.map((room)=>{
          let newRoom = roomsAdded.find(newlyAddedRoom => room._id.equals(newlyAddedRoom._id));
          if(!newRoom)
            return room;
          return newRoom;
        }) 
        await hotelRecord.save();
      }
      
      const savedVoucher = await voucher.save();

      // Update ledger based on payment method
      let customerLedger = await Ledger.findOne({
        cusId: customer,
        role: "customer",
      });
      let cashLedger = null;
      let bankLedger = null;

      const customerEntry = {
        title: "Booking",
        debit: totalAmount,
        credit: 0,
        balance: totalAmount,
      };

      if (paymentMethod === "cash") {
        cashLedger = await Ledger.findOne({ role: "cash" });

        const cashEntry = {
          title: "Booking",
          debit: 0,
          credit: totalAmount,
          balance: -totalAmount,
        };

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
      } else if (paymentMethod === "bank" && bankId) {
        bankLedger = await Ledger.findOne({ role: "bank", bankId });

        const bankEntry = {
          title: "Booking",
          debit: 0,
          credit: totalAmount,
          balance: -totalAmount,
        };

        if (bankLedger) {
          bankLedger.entries.push(bankEntry);
          bankLedger.totalBalance -= totalAmount;
        } else {
          bankLedger = new Ledger({
            bankId,
            hotelId: accommodations[0].hotel,
            role: "bank",
            entries: [bankEntry],
            totalBalance: -totalAmount,
          });
        }
      }

      // Save ledgers
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

      await customerLedger.save();
      if (cashLedger) await cashLedger.save();
      if (bankLedger) await bankLedger.save();

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
      return res
        .status(500)
        .send({ success: false, data: { error: error.message } });
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
      } = req.query;

      // Validate the input
      if (!reportType || !hotelId || !confirmationStatus) {
        return res.status(400).send({
          success: false,
          data: {
            error:
              "Missing required query parameters: reportType, hotelId, and confirmationStatus are required.",
          },
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
          return res.status(400).send({
            success: false,
            data: {
              error:
                "Missing required query parameters: fromDate and toDate are required for custom duration.",
            },
          });
        }
        from = new Date(fromDate);
        to = new Date(toDate);
      } else {
        return res.status(400).send({
          success: false,
          data: {
            error:
              "Invalid duration selected. Valid options are: Today, Tomorrow, or Custom.",
          },
        });
      }

      // Determine the filter field based on the reportType
      let dateFilterField;
      if (reportType === "Arrival Intimation") {
        dateFilterField = "accommodations.checkin";
      } else if (reportType === "Departure Intimation") {
        dateFilterField = "accommodations.checkout";
      } else {
        return res.status(400).send({
          success: false,
          data: {
            error:
              "Invalid report type. Valid options are: Arrival Intimation or Departure Intimation.",
          },
        });
      }

      let confirmationStatusQuery;
      if (confirmationStatus === "Both") {
        confirmationStatusQuery = { $in: ["Tentative", "Confirmed"] };
      } else if (["Tentative", "Confirmed"].includes(confirmationStatus)) {
        confirmationStatusQuery = confirmationStatus;
      } else {
        return res.status(400).send({
          success: false,
          data: {
            error:
              "Invalid confirmation status. Valid options are: Tentative, Confirmed, or Both.",
          },
        });
      }

      // Build the query
      let query = {
        confirmationStatus: confirmationStatusQuery,
        "accommodations.hotel": hotelId,
        [dateFilterField]: { $gte: from, $lte: to },
      };

      // Find vouchers matching the criteria
      const vouchers = await Voucher.find(query).populate("customer");

      if (!vouchers.length) {
        return res.status(404).send({
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

        const customerAge = voucher.age;
        if (customerAge !== undefined) {
          const customerType = getPaxType(customerAge);
          if (customerType === "adult") adultCount++;
          if (customerType === "child") childCount++;
          if (customerType === "infant") infantCount++;
        }

        if (voucher.passengers && Array.isArray(voucher.passengers)) {
          voucher.passengers.forEach((passenger) => {
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
