const mongoose = require('mongoose');

const subGoalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    deadline: { type: Date, default: null },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    subGoals: [subGoalSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);
