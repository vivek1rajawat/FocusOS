const Note = require('../models/Note');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const getNotes = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.q) filter.$text = { $search: req.query.q };

  const notes = await Note.find(filter).sort({ updatedAt: -1 });
  res.json({ success: true, notes });
});

const getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) throw new ApiError(404, 'Note not found');
  res.json({ success: true, note });
});

const createNote = asyncHandler(async (req, res) => {
  const { title, content, tags } = req.body;
  if (!title) throw new ApiError(400, 'title is required');
  const note = await Note.create({ user: req.user._id, title, content, tags });
  res.status(201).json({ success: true, note });
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) throw new ApiError(404, 'Note not found');

  ['title', 'content', 'tags'].forEach((f) => {
    if (req.body[f] !== undefined) note[f] = req.body[f];
  });
  await note.save();
  res.json({ success: true, note });
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!note) throw new ApiError(404, 'Note not found');
  res.json({ success: true, message: 'Note deleted' });
});

module.exports = { getNotes, getNote, createNote, updateNote, deleteNote };
