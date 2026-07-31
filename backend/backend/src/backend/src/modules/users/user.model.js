const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:       { type: String, default: 'Casa' },
  street:      String,
  city:        String,
  state:       String,
  zipCode:     String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  isDefault: { type: Boolean, default: false }
});

const savedCardSchema = new mongoose.Schema({
  last4:    String,
  brand:    String,
  stripeId: String
});

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  phone:     { type: String, unique: true, sparse: true },
  password:  { type: String, select: false },
  avatar:    { type: String, default: '' },
  role:      { type: String, enum: ['client','admin'], default: 'client' },

  addresses:    [addressSchema],
  savedCards:   [savedCardSchema],

  // Wallet Di TILLO (futuro)
  walletBalance: { type: Number, default: 0 },

  // Estadísticas
  totalOrders:   { type: Number, default: 0 },
  totalSpent:    { type: Number, default: 0 },

  // Auth
  googleId:      String,
  isVerified:    { type: Boolean, default: false },
  otpCode:       String,
  otpExpires:    Date,
  isActive:      { type: Boolean, default: true },

  // Preferencias
  favoriteCommerces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Commerce' }],
  favoriteProducts:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product'  }],

  pushToken: String, // Para notificaciones push

}, { timestamps: true });

// ── Hash de contraseña ─────────────────────────────────────────────────────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otpCode;
  delete obj.otpExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
