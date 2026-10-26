const env = require('../config/env');

exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  else if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.code === 11000) { status = 409; message = 'That value is already in use'; }
  else if (err.type === 'StripeInvalidRequestError' || err.type === 'StripeCardError') { status = 400; }
  else if (err.statusCode && err.error && err.error.description) { status = 400; message = err.error.description; } // Razorpay
  else if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON body'; }

  if (status >= 500) {
    console.error(err);
    if (env.isProd) message = 'Something went wrong on our side. Please try again.';
  }
  res.status(status).json({ message, ...(err.details ? { details: err.details } : {}) });
};
