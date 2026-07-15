const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const generateRandomToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

module.exports = { generateAccessToken, generateRandomToken, hashToken };
