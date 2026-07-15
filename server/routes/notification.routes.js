const express = require('express');
const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
