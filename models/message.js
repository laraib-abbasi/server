const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exchange: {
    type: Schema.Types.ObjectId,
    ref: 'Exchange',
    required: true
  }
}, { timestamps: true });

// Add indexes
messageSchema.index({ exchange: 1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;