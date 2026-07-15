const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  reorderTasks,
  deleteTask,
  startTimer,
  stopTimer,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router.route('/').get(getTasks).post(createTask);
router.post('/reorder', reorderTasks);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.post('/:id/timer/start', startTimer);
router.post('/:id/timer/stop', stopTimer);

module.exports = router;
