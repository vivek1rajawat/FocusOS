const express = require('express');
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addSubGoal,
  updateSubGoal,
  deleteSubGoal,
} = require('../controllers/goal.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router.route('/').get(getGoals).post(createGoal);
router.route('/:id').get(getGoal).put(updateGoal).delete(deleteGoal);
router.post('/:id/subgoals', addSubGoal);
router.route('/:id/subgoals/:subId').put(updateSubGoal).delete(deleteSubGoal);

module.exports = router;
