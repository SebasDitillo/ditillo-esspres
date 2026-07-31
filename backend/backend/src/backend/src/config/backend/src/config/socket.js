const jwt = require('jsonwebtoken');
const Order  = require('../modules/orders/order.model');
const Rider  = require('../modules/riders/rider.model');

const connectedUsers  = new Map(); // userId → socketId
const connectedRiders = new Map(); // riderId → socketId

const initializeSocket = (io) => {

  // ── Autenticación de socket ──────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token requerido'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;
    console.log(`🔌 Conectado: ${role} - ${userId}`);

    // ── Registrar según rol ────────────────────────────────────────────────────
    if (role === 'rider') {
      connectedRiders.set(userId, socket.id);
    } else {
      connectedUsers.set(userId, socket.id);
    }

    // ── Ubicación del repartidor ───────────────────────────────────────────────
    socket.on('rider:location', async ({ lat, lng, orderId }) => {
      try {
        await Rider.findByIdAndUpdate(userId, {
          location: { type: 'Point', coordinates: [lng, lat] }
        });
        if (orderId) {
          const order = await Order.findById(orderId);
          if (order) {
            const clientSocket = connectedUsers.get(order.client.toString());
            if (clientSocket) {
              io.to(clientSocket).emit('tracking:update', { lat, lng, orderId });
            }
          }
        }
      } catch (err) { console.error('rider:location error', err); }
    });

    // ── Repartidor cambia estado ───────────────────────────────────────────────
    socket.on('rider:status', async ({ status }) => {
      await Rider.findByIdAndUpdate(userId, { status });
      socket.broadcast.emit('rider:statusChanged', { riderId: userId, status });
    });

    // ── Unirse a sala de pedido ────────────────────────────────────────────────
    socket.on('order:join', (orderId) => socket.join(`order:${orderId}`));

    // ── Desconexión ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      connectedUsers.delete(userId);
      connectedRiders.delete(userId);
      if (role === 'rider') {
        await Rider.findByIdAndUpdate(userId, { status: 'offline' });
      }
      console.log(`🔌 Desconectado: ${role} - ${userId}`);
    });
  });
};

// Emitir evento a un usuario específico
const emitToUser = (io, userId, event, data) => {
  const socketId = connectedUsers.get(userId?.toString());
  if (socketId) io.to(socketId).emit(event, data);
};

// Emitir evento a un repartidor específico
const emitToRider = (io, riderId, event, data) => {
  const socketId = connectedRiders.get(riderId?.toString());
  if (socketId) io.to(socketId).emit(event, data);
};

module.exports = { initializeSocket, emitToUser, emitToRider, connectedRiders };
