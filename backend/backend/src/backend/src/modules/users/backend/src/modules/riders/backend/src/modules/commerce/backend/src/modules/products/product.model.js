const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  name:     String,
  required: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  choices: [{
    name:      String,
    price:     { type: Number, default: 0 },
    available: { type: Boolean, default: true }
  }]
});

const productSchema = new mongoose.Schema({
  commerce:    { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce', required: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  name:        { type: String, required: true },
  description: String,
  price:       { type: Number, required: true, min: 0 },
  priceUSD:    Number,

  images:      [String],
  image:       { type: String, default: '' },

  // Opciones/modificadores (ej: tamaño, extras)
  options:     [optionSchema],

  // Etiquetas
  tags:        [String],
  isVegetarian:{ type: Boolean, default: false },
  isVegan:     { type: Boolean, default: false },
  isSpicy:     { type: Boolean, default: false },

  // Promoción
  hasDiscount:  { type: Boolean, default: false },
  discountType: { type: String, enum: ['percentage','fixed'] },
  discountValue:{ type: Number, default: 0 },
  discountEnds: Date,

  // Inventario
  inStock:      { type: Boolean, default: true },
  stock:        Number, // null = ilimitado

  // Estadísticas
  totalSold:    { type: Number, default: 0 },
  rating:       { type: Number, default: 5.0 },

  isActive:     { type: Boolean, default: true },
  isFeatured:   { type: Boolean, default: false },

  sortOrder:    { type: Number, default: 0 },

}, { timestamps: true });

productSchema.index({ commerce: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Precio final con descuento
productSchema.virtual('finalPrice').get(function() {
  if (!this.hasDiscount) return this.price;
  if (this.discountType === 'percentage') {
    return this.price * (1 - this.discountValue / 100);
  }
  return Math.max(0, this.price - this.discountValue);
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
