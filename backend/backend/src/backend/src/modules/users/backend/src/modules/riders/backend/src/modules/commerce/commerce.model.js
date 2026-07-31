const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const scheduleSchema = new mongoose.Schema({
  day:    { type: Number, min: 0, max: 6 }, // 0=Dom, 6=Sáb
  open:   String, // "08:00"
  close:  String, // "22:00"
  closed: { type: Boolean, default: false }
});

const commerceSchema = new mongoose.Schema({
  // ── Información básica ──────────────────────────────────────────────────────
  name:        { type: String, required: true },
  description: String,
  email:       { type: String, required: true, unique: true, lowercase: true },
  phone:       String,
  password:    { type: String, required: true, select: false },
  role:        { type: String, default: 'commerce' },

  // ── Categoría ───────────────────────────────────────────────────────────────
  category: {
    type: String,
    enum: [
      'restaurante','supermercado','farmacia','charcuteria',
      'panaderia','licoreria','tienda','veterinaria',
      'floristeria','ferreteria','otro'
    ],
    required: true
  },

  // ── Imágenes ────────────────────────────────────────────────────────────────
  logo:        { type: String, default: '' },
  coverImage:  { type: String, default: '' },
  images:      [String],

  // ── Ubicación ───────────────────────────────────────────────────────────────
  address: {
    street:  String,
    city:    { type: String, default: 'Caracas' },
    state:   { type: String, default: 'Miranda' },
    country: { type: String, default: 'Venezuela' }
  },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },

  // ── Configuración financiera ─────────────────────────────────────────────────
  commissionRate:   { type: Number, default: 10 },   // %
  deliveryFee:      { type: Number, default: 2.00 }, // $
  minOrderAmount:   { type: Number, default: 0 },
  estimatedTime:    { type: String, default: '30-45 min' },

  // ── Calificación ────────────────────────────────────────────────────────────
  rating:      { type: Number, default: 5.0, min: 1, max: 5 },
  totalRatings:{ type: Number, default: 0 },

  // ── Horario ─────────────────────────────────────────────────────────────────
  schedule: [scheduleSchema],

  // ── Publicidad ──────────────────────────────────────────────────────────────
  isPremium:    { type: Boolean, default: false },
  isPromoted:   { type: Boolean, default: false },
  promotedUntil:Date,
  plan: {
    type:    String,
    enum:    ['basic','standard','premium'],
    default: 'basic'
  },

  // ── Tags para búsqueda ───────────────────────────────────────────────────────
  tags: [String],

  // ── Estadísticas ────────────────────────────────────────────────────────────
  totalOrders:  { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },

  // ── Estado ──────────────────────────────────────────────────────────────────
  isOpen:    { type: Boolean, default: true },
  isActive:  { type: Boolean, default: true },
  isVerified:{ type: Boolean, default: false },

  pushToken: String,

}, { timestamps: true });

commerceSchema.index({ location: '2dsphere' });
commerceSchema.index({ category: 1 });
commerceSchema.index({ name: 'text', description: 'text', tags: 'text' });

commerceSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

commerceSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

commerceSchema.methods.isOpenNow = function() {
  const now  = new Date();
  const day  = now.getDay();
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const sch  = this.schedule.find(s => s.day === day);
  if (!sch || sch.closed) return false;
  return time >= sch.open && time <= sch.close;
};

module.exports = mongoose.model('Commerce', commerceSchema);
