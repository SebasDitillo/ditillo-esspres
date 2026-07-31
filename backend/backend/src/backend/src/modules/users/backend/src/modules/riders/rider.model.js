const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const earningsSchema = new mongoose.Schema({
  date:       { type: Date, default: Date.now },
  amount:     Number,
  orderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type:       { type: String, enum: ['delivery','tip','bonus'], default: 'delivery' }
});

const riderSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  phone:    { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  avatar:   { type: String, default: '' },
  role:     { type: String, default: 'rider' },

  // Vehículo
  vehicleType:  { type: String, enum: ['moto','bicicleta','carro'], default: 'moto' },
  vehiclePlate: String,

  // Documentos
  idCard:        String, // Cédula
  licensePhoto:  String,
  vehiclePhoto:  String,

  // Estado operativo
  status: {
    type: String,
    enum: ['available','busy','offline','suspended'],
    default: 'offline'
  },

  // Ubicación GPS (GeoJSON)
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },

  // Zona de trabajo
  zone: { type: String, default: 'Caracas' },

  // Estadísticas
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings:   { type: Number, default: 0 },
  rating:          { type: Number, default: 5.0, min: 1, max: 5 },
  totalRatings:    { type: Number, default: 0 },

  // Ganancias detalladas
  earnings:     [earningsSchema],

  // Estado de la cuenta
  isVerified:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },

  // Orden actual
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  pushToken: String,

}, { timestamps: true });

riderSchema.index({ location: '2dsphere' });

riderSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

riderSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Ganancias del día
riderSchema.methods.getTodayEarnings = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return this.earnings
    .filter(e => new Date(e.date) >= today)
    .reduce((sum, e) => sum + e.amount, 0);
};

module.exports = mongoose.model('Rider', riderSchema);
