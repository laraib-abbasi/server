const mongoose = require('mongoose');

const exchangeSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  offeredBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  // Add this to your book schema
status: {
  type: String,
  enum: ['pending-exchange', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending-exchange'
},
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

exchangeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Exchange', exchangeSchema);
