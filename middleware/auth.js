const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).send({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    console.error("JWT error:", error);
    res.status(401).send({ message: 'Invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send({ message: 'Admin access denied' });
  }
  next();
};

module.exports = { auth, admin };