const router = require('express').Router();
const c = require('../controllers/admin.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const s = require('../validators/schemas');

router.use(authenticate, authorize('admin'));
router.get('/stats', c.stats);
router.get('/users', c.listUsers);
router.patch('/users/:id', validate(s.adminUserUpdate), c.updateUser);
router.post('/orders/:id/refund', c.refundOrder);

module.exports = router;
