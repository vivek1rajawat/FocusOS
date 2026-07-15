const express = require('express');
const { createSubtask, updateSubtask, deleteSubtask } = require('../controllers/subtask.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router.post('/', createSubtask);
router.route('/:id').put(updateSubtask).delete(deleteSubtask);

module.exports = router;
