const router = require('express').Router();
const c = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const s = require('../validators/schemas');

router.use(authenticate);
router.post('/', authorize('customer'), validate(s.createOrder), c.create);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.post('/:id/cancel', authorize('customer'), c.cancelPending);
router.patch('/:id/status', authorize('retailer', 'delivery', 'admin'), validate(s.orderStatus), c.updateStatus);

module.exports = router;
