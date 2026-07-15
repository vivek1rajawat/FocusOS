const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subtask', subtaskSchema);
