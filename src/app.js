const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.clientUrl.split(','), credentials: true }));
if (!env.isProd) app.use(morgan('dev'));

// Webhooks need the untouched raw body, so they are mounted BEFORE express.json()
app.use('/api/webhooks', require('./routes/webhook.routes'));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // blocks NoSQL operator injection ($gt, $ne ...)
app.use(hpp());
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
