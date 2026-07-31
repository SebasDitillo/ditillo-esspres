const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:        String,
  image:       String,
  price:       Number,
  quantity:    { type: Number, min: 1 },
  options:     mongoose.Schema.Types.Mixed,
  subtotal:    Number,
});

const statusHistorySchema = new mongoose.Schema({
  status:    String,
  timestamp: { type: Date, default: Date.now },
  note:      String,
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },

  // ── Partes involucradas ──────────────────────────────────────────────────────
  client:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  commerce: { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce',required: true },
  rider:    { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },

  // ── Ítems ───────────────────────────────────────────────────────────────────
  items:    [orderItemSchema],

  // ── Montos ──────────────────────────────────────────────────────────────────
  subtotal:        Number,
  deliveryFee:     Number,
  discount:        { type: Number, default: 0 },
  tip:             { type: Number, default: 0 },
  total:           Number,
  commissionAmount:Number, // Lo que gana Di TILLO
  commerceAmount:  Number, // Lo que gana el comercio
  riderAmount:     Number, // Lo que gana el repartidor

  // ── Estado ──────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: [
      'pending',           // Pedido creado
      'confirmed',         // Comercio confirmó
      'preparing',         // En preparación
      'ready',             // Listo para recoger
      'rider_assigned',    // Repartidor asignado
      'picked_up',         // Repartidor recogió
      'on_the_way',        // En camino
      'arriving',          // Llegando (< 2 min)
      'delivered',         // Entregado
      'cancelled',         // Cancelado
      'refunded'           // Reembolsado
    ],
    default: 'pending'
  },

  statusHistory:  [statusHistorySchema],
  cancelReason:   String,
  cancelledBy:    String, // 'client' | 'commerce' | 'admin'

  // ── Pago ────────────────────────────────────────────────────────────────────
  paymentMethod: {
    type: String,
    enum: ['pago_movil','transferencia','efectivo','divisas','tarjeta','wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending','paid','failed','refunded'],
    default: 'pending'
  },
  paymentReference: String,
  stripePaymentId:  String,

  // ── Entrega ─────────────────────────────────────────────────────────────────
  deliveryAddress: {
    street:      String,
    city:        String,
    state:       String,
    coordinates: { lat: Number, lng: Number },
    label:       String,
    notes:       String,
  },
  deliveryNotes: String,

  // ── Promoción ───────────────────────────────────────────────────────────────
  couponCode:    String,
  couponId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },

  // ── Tiempos ─────────────────────────────────────────────────────────────────
  estimatedPickupTime:   Date,
  estimatedDeliveryTime: Date,
  pickedUpAt:            Date,
  deliveredAt:           Date,

  // ── Calificaciones ──────────────────────────────────────────────────────────
  ratingCommerce: Number,
  ratingRider:    Number,
  isRated:        { type: Boolean, default: false },

}, { timestamps: true });

// Generar número de orden automático
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `DT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Agregar entrada al historial de estados
orderSchema.methods.addStatus = function(status, note = '') {
  this.status = status;
  this.statusHistory.push({ status, note });
};

orderSchema.index({ client: 1, createdAt: -1 });
orderSchema.index({ commerce: 1, createdAt: -1 });
orderSchema.index({ rider: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
