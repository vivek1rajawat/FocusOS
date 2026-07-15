const mongoose = require('mongoose');

const toolCallSchema = new mongoose.Schema(
  {
    name: String,
    summary: String,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    toolCalls: [toolCallSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New Chat' },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
