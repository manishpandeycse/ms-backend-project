const router = require('express').Router();
const c = require('../controllers/payment.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const s = require('../validators/schemas');

router.post('/stripe/confirm', authenticate, authorize('customer'), validate(s.stripeConfirm), c.stripeConfirm);
router.post('/razorpay/verify', authenticate, authorize('customer'), validate(s.razorpayVerify), c.razorpayVerify);

module.exports = router;
