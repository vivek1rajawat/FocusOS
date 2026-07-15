const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed', 'blocked', 'cancelled'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    deadline: { type: Date, default: null },
    estimatedTime: { type: Number, default: 0 },
    actualTime: { type: Number, default: 0 },
    timerStartedAt: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    tags: [{ type: String, trim: true }],
    attachments: [
      {
        url: String,
        name: String,
        type: String,
      },
    ],
    order: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
