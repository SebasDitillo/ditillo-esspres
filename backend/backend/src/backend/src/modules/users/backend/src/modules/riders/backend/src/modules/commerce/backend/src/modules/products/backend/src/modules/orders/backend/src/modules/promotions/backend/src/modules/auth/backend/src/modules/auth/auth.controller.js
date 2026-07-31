const jwt      = require('jsonwebtoken');
const User     = require('../users/user.model');
const Commerce = require('../commerce/commerce.model');
const Rider    = require('../riders/rider.model');

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d'
  });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

const generateOTP = () =>
  String(Math.floor(100000 + Math.random() * 900000));

// ── Registro de cliente ───────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email ya registrado' });
    }

    const user  = await User.create({ name, email, password, phone });
    const token = signToken({ id: user._id, role: 'client' });

    res.status(201).json({
      success: true,
      message: '¡Bienvenido a Di TILLO Express!',
      token,
      user: user.toPublic()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Login de cliente ──────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Cuenta suspendida' });
    }

    const token   = signToken({ id: user._id, role: user.role });
    const refresh = signRefresh({ id: user._id });

    res.json({ success: true, token, refresh, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Login de comercio ─────────────────────────────────────────────────────────
exports.loginCommerce = async (req, res) => {
  try {
    const { email, password } = req.body;
    const commerce = await Commerce.findOne({ email }).select('+password');

    if (!commerce || !(await commerce.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = signToken({ id: commerce._id, role: 'commerce' });
    const data  = commerce.toObject(); delete data.password;

    res.json({ success: true, token, commerce: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Login de repartidor ───────────────────────────────────────────────────────
exports.loginRider = async (req, res) => {
  try {
    const { email, password } = req.body;
    const rider = await Rider.findOne({ email }).select('+password');

    if (!rider || !(await rider.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    if (!rider.isActive) {
      return res.status(403).json({ success: false, message: 'Cuenta suspendida' });
    }

    const token = signToken({ id: rider._id, role: 'rider' });
    const data  = rider.toObject(); delete data.password;

    res.json({ success: true, token, rider: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Google OAuth ──────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({ googleId, email, name, avatar, isVerified: true });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = signToken({ id: user._id, role: user.role });
    res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Enviar OTP ────────────────────────────────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const otp       = generateOTP();
    const expires   = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await User.findOneAndUpdate(
      { phone },
      { otpCode: otp, otpExpires: expires },
      { upsert: true }
    );

    // TODO: Enviar via Twilio
    console.log(`OTP para ${phone}: ${otp}`);

    res.json({ success: true, message: 'OTP enviado' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Verificar OTP ─────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone, otpCode: otp, otpExpires: { $gt: new Date() } });

    if (!user) {
      return res.status(400).json({ success: false, message: 'OTP inválido o expirado' });
    }

    user.isVerified = true;
    user.otpCode    = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken({ id: user._id, role: user.role });
    res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  res.json({ success: true, message: 'Email de recuperación enviado (TODO)' });
};

exports.resetPassword = async (req, res) => {
  res.json({ success: true, message: 'Contraseña actualizada (TODO)' });
};

exports.refreshToken = async (req, res) => {
  try {
    const { refresh } = req.body;
    const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const token   = signToken({ id: decoded.id, role: decoded.role });
    res.json({ success: true, token });
  } catch {
    res.status(401).json({ success: false, message: 
