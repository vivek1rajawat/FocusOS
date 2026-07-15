const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['task_due', 'deadline_missed', 'project_completed', 'weekly_report', 'general'],
      default: 'general',
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
