const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const Schema = mongoose.Schema;


const packageSchema = new Schema({
  packageId: {
    type: Number,
    unique: true
  },
  packageName: {
    type: String,
    required: true
  },
  hotels: [{
    hotel: {
      type: Schema.Types.ObjectId,
      ref: 'hotel'
    },
    roomRate: {
      type: Number,
      required: true
    },
    bedRates: {
      single: Number,
      double: Number,
      triple: Number,
      quatre: Number,
      studio: Number
    }
  }],
  validity: {
    from: {
      type: Date,
      required: true
    },
    to: {
      type: Date,
      required: true
    }
  }
});

autoIncrement.initialize(mongoose.connection);

packageSchema.plugin(autoIncrement.plugin, {
  model: 'Package',
  field: 'packageId',
  startAt: 1,
  incrementBy: 1
});

module.exports = mongoose.model('Package', packageSchema);
