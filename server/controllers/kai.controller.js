const Conversation = require('../models/Conversation');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { runAgentTurn } = require('../services/groq.service');

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ user: req.user._id })
    .select('title updatedAt createdAt')
    .sort({ updatedAt: -1 })
    .limit(50);
  res.json({ success: true, conversations });
});

const getConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  res.json({ success: true, conversation });
});

const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  res.json({ success: true, message: 'Conversation deleted' });
});

const makeTitle = (text) => {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed || 'New Chat';
};

// POST /api/kai/chat  { conversationId?, message }
// Streams the assistant's final answer as plain text chunks over a chunked HTTP response.
const chat = asyncHandler(async (req, res) => {
  const { conversationId, message } = req.body;
  if (!message || !message.trim()) throw new ApiError(400, 'message is required');

  let conversation = conversationId
    ? await Conversation.findOne({ _id: conversationId, user: req.user._id })
    : null;

  if (!conversation) {
    conversation = await Conversation.create({ user: req.user._id, title: makeTitle(message), messages: [] });
  }

  conversation.messages.push({ role: 'user', content: message });
  // Save the user's message right away so it isn't lost if the AI call below fails.
  await conversation.save();

  const history = conversation.messages.map((m) => ({ role: m.role, content: m.content }));

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Conversation-Id', conversation._id.toString());
  res.flushHeaders?.();

  try {
    const { content, toolCalls } = await runAgentTurn({
      userId: req.user._id,
      history,
      onToken: (delta) => res.write(delta),
    });

    conversation.messages.push({ role: 'assistant', content, toolCalls });
    await conversation.save();
  } catch (err) {
    res.write(`\n\n${err.message}`);
  } finally {
    res.end();
  }
});

module.exports = { getConversations, getConversation, deleteConversation, chat };
