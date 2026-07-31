const router  = require('express').Router();
const { body } = require('express-validator');
const ctrl    = require('./auth.controller');
const { validate } = require('../../middlewares/validate');

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
    validate
  ],
  ctrl.register
);

router.post('/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
    validate
  ],
  ctrl.login
);

router.post('/login/commerce',   ctrl.loginCommerce);
router.post('/login/rider',      ctrl.loginRider);
router.post('/google',           ctrl.googleAuth);
router.post('/send-otp',         ctrl.sendOTP);
router.post('/verify-otp',       ctrl.verifyOTP);
router.post('/forgot-password',  ctrl.forgotPassword);
router.post('/reset-password',   ctrl.resetPassword);
router.post('/refresh-token',    ctrl.refreshToken);

module.exports = router;
