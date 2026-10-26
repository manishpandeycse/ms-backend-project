const Order = require('../models/Order');
const { closePending } = require('../services/order.service');

// Releases stock held by abandoned checkouts. Late payments are auto-refunded by settlePaid().
async function run() {
  try {
    const stale = await Order.find({ status: 'pending_payment', expiresAt: { $lt: new Date() } }).select('_id').limit(100);
    for (const o of stale) await closePending(o._id, 'expired');
    if (stale.length) console.log(`Expired ${stale.length} unpaid order(s)`);
  } catch (e) {
    console.error('expirePending job failed:', e.message);
  }
}

module.exports = () => {
  const timer = setInterval(run, 5 * 60 * 1000);
  timer.unref();
  run();
};
