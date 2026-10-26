const ApiError = require('../utils/ApiError');

module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new ApiError(400, details[0] ? `${details[0].field || 'request'}: ${details[0].message}` : 'Invalid request', details));
  }
  if (source === 'query') Object.assign(req.query, result.data);
  else req[source] = result.data; // unknown fields are stripped
  next();
};
