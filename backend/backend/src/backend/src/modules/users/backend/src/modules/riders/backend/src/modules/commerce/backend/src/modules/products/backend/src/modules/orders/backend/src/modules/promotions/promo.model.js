const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  code:        { type: String, unique: true, uppercase: true },
  title:       String,
  description: String,
  type: {
    type: String,
    enum: ['percentage','fixed','free_delivery','2x1','cashback'],
    required: true
  },
  value:       Number, // % o monto fijo
  minOrder:    { type: Number, default: 0 },
  maxDiscount: Number,

  // Aplicabilidad
  scope: {
    type: String,
    enum: ['all','commerce','category','product'],
    default: 'all'
  },
  commerce:    { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce' },
  category:    String,

  // Uso
  usageLimit:     Number,
  usedCount:      { type: Number, default: 0 },
  usagePerUser:   { type: Number, default: 1 },
  usedBy:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Vigencia
  startsAt:    Date,
  expiresAt:   Date,

  // Visibilidad
  isPublic:    { type: Boolean, default: true },
  isActive:    { type: Boolean, default: true },

  // Estadísticas
  totalSavings: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('Promotion', promoSchema);
