const jwt = require('jsonwebtoken');
exports.auth = (req, res, next) => {
  try {
    req.userId = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET).id;
    next();
  } catch { res.status(401).json({ error: 'Please log in again.' }); }
};
