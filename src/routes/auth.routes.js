const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const s = require('../validators/schemas');

const strict = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts, please try again later' } });

router.post('/register', strict, validate(s.register), c.register);
router.post('/login', strict, validate(s.login), c.login);
router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.get('/me', authenticate, c.me);
router.patch('/password', authenticate, validate(s.changePassword), c.changePassword);

module.exports = router;
