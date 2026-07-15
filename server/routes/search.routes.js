const express = require('express');
const { globalSearch } = require('../controllers/search.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.get('/', protect, globalSearch);

module.exports = router;
