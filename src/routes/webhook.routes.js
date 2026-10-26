const router = require('express').Router();
const express = require('express');
const c = require('../controllers/payment.controller');

// Raw body is mandatory for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), c.stripeWebhook);
router.post('/razorpay', express.raw({ type: 'application/json' }), c.razorpayWebhook);

module.exports = router;
