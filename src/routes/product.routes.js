const router = require('express').Router();
const c = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize, requireApprovedRetailer } = require('../middleware/auth');
const s = require('../validators/schemas');

router.get('/', validate(s.productQuery, 'query'), c.list);
router.get('/categories', c.categories);
router.get('/mine', authenticate, authorize('retailer', 'admin'), c.mine);
router.get('/:id', c.getOne);

router.post('/', authenticate, authorize('retailer', 'admin'), requireApprovedRetailer, validate(s.productCreate), c.create);
router.patch('/:id', authenticate, authorize('retailer', 'admin'), requireApprovedRetailer, validate(s.productUpdate), c.update);
router.delete('/:id', authenticate, authorize('retailer', 'admin'), requireApprovedRetailer, c.remove);

module.exports = router;
