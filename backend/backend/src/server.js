require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { initializeSocket } = require('./config/socket');

// ── Rutas ─────────────────────────────────────────────────────────────────────
const authRoutes       = require('./modules/auth/auth.routes');
const userRoutes       = require('./modules/users/user.routes');
const commerceRoutes   = require('./modules/commerce/commerce.routes');
const productRoutes    = require('./modules/products/product.routes');
const orderRoutes      = require('./modules/orders/order.routes');
const riderRoutes      = require('./modules/riders/rider.routes');
const paymentRoutes    = require('./modules/payments/payment.routes');
const promoRoutes      = require('./modules/promotions/promo.routes');
const adminRoutes      = require('./modules/admin/admin.routes');
const notifRoutes      = require('./modules/notifications/notif.routes');
const categoryRoutes   = require('./modules/categories/category.routes');
const reviewRoutes     = require('./modules/reviews/review.routes');
const trackingRoutes   = require('./modules/tracking/tracking.routes');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

// ── Middlewares ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Inyectar io en req ────────────────────────────────────────────────────────
app.use((req, _res, next) => { req.io = io; next(); });

// ── Rutas API ─────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/commerce',      commerceRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/riders',        riderRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/promotions',    promoRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/tracking',      trackingRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', app: 'Di TILLO Express', version: '1.0.0' })
);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
initializeSocket(io);

// ── Inicio ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () =>
    console.log(`🚀 Di TILLO Express Backend corriendo en puerto ${PORT}`)
  );
});

module.exports = { app, io };
