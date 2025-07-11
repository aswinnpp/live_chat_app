import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  blocked: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  otp: { type: String },
  isVerified: { type: Boolean, default: false },
  otpCreatedAt: { type: Date },
});



export default mongoose.model('User', userSchema);



