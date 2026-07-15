const express = require('express');
const { getConversations, getConversation, deleteConversation, chat } = require('../controllers/kai.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);
router.post('/chat', chat);

module.exports = router;
