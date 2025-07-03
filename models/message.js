import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  room: String,
  from: String,
  cipher: String,
  timestamp: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false } 
});

messageSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
messageSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Message', messageSchema);

