import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  blocked: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

userSchema.statics.ensureAdmin = async function() {
  const adminEmail = 'aswincp554@gmail.com';
  const adminPassword = '@Aswin123';
  let admin = await this.findOne({ email: adminEmail });
  if (!admin) {
    const bcrypt = (await import('bcrypt')).default;
    const hashed = await bcrypt.hash(adminPassword, 10);
    admin = await this.create({ email: adminEmail, username: 'admin', password: hashed, role: 'admin' });
  }
  return admin;
};

export default mongoose.model('User', userSchema);



