const mongoose = require("mongoose");

const passSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  passportNumber: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
});

const accommodationSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.ObjectId, ref: "hotel", required: true },
  roomType: { type: String, required: true },
  checkin: { type: Date, required: true },
  checkout: { type: Date, required: true },
  bedRate: {
    type: Number,
    required: function () {
      return this.roomType === "Shared" && this.customerType === 'guest';
    },
  },
  noOfBeds: {
    type: Number,
    required: function () {
      return this.roomType === "Shared" && this.customerType === 'guest';
    },
  },
  roomRate: {
    type: Number,
    required: function () {
      return this.customerType !== 'guest' || this.roomType !== 'Shared';
    },
  },
  totalRooms: {
    type: Number,
    required: function () {
      return this.customerType !== 'guest' || this.roomType !== 'Shared';
    },
  },
});

const voucherSchema = new mongoose.Schema({
  voucherNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.ObjectId, ref: "user", required: true },
  confirmationStatus: {
    type: String,
    enum: ["Confirmed", "Tentative"],
    required: true,
  },
  tentativeHours: {
    type: Number,
    required: function () {
      return this.confirmationStatus === "Tentative";
    },
  },
  tentativeDate: { type: Date, default:null },
  confirmationType: {
    type: String,
    enum: ["Individual", "Group"],
    default: "Individual",
    required: true,
  },
  vatnumber: {
    type: String,
    required: true,
  },
  accommodations: [accommodationSchema],
  companyName: {
    type: String,
    required: false,
  },
  age: {
    type: Number,
    required: true,
  },
  passportNumber: {
    type: String,
    required: false,
  },
  passengers: {
    type: [passSchema],
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
});

// Middleware for validation and setting confirmationType
voucherSchema.pre('validate', async function (next) {
  if (this.isModified('customer')) {
    try {
      const User = mongoose.model('user');
      const customer = await User.findById(this.customer);
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      if (customer.customerType === 'b2b') {
        this.companyName = this.companyName || 'Default Company Name';
        this.confirmationType = 'Group';
      } else if (customer.customerType === 'guest') {
        this.passportNumber = this.passportNumber || 'ABASV141';
        this.confirmationType = 'Individual';
      } else {
        throw new Error('Unknown customer type');
      }

      // Assign customerType to accommodations
      this.accommodations.forEach(accommodation => {
        accommodation.customerType = customer.customerType;
      });

      if (this.confirmationStatus === "Tentative") {
        this.tentativeDate = new Date(Date.now() + this.tentativeHours * 3600000); 
      } else {
        this.tentativeDate = null;
      }
      
    } catch (error) {
      next(error);
    }
  }

  next();
});

module.exports = mongoose.model("voucher", voucherSchema, "vouchers");
