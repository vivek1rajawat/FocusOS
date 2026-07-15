const express = require('express');
const { getAnalytics } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.get('/', protect, getAnalytics);

module.exports = router;
