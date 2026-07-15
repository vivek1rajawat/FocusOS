const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { generateAccessToken, generateRandomToken, hashToken } = require('../utils/generateToken');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../services/email.service');
const { verifyGoogleToken } = require('../services/googleAuth.service');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const rawToken = generateRandomToken();
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    verificationToken: hashToken(rawToken),
    verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000,
  });

  await sendVerificationEmail(user, rawToken);

  const token = generateAccessToken(user._id);
  res.status(201).json({
    success: true,
    message: 'Account created. Check your email to verify your account.',
    token,
    user: user.toSafeObject(),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const today = new Date().toDateString();
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
  if (lastActive !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    user.streak = lastActive === yesterday ? user.streak + 1 : 1;
    user.lastActiveDate = new Date();
    await user.save();
  }

  const token = generateAccessToken(user._id);
  res.json({ success: true, token, user: user.toSafeObject() });
});

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new ApiError(400, 'Google idToken is required');

  const profile = await verifyGoogleToken(idToken);

  let user = await User.findOne({ email: profile.email });
  if (!user) {
    user = await User.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      avatar: profile.avatar,
      isVerified: true,
    });
  } else if (!user.googleId) {
    user.googleId = profile.googleId;
    user.isVerified = true;
    await user.save();
  }

  const token = generateAccessToken(user._id);
  res.json({ success: true, token, user: user.toSafeObject() });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, 'Verification token is required');

  const hashed = hashToken(token);
  const user = await User.findOne({
    verificationToken: hashed,
    verificationTokenExpire: { $gt: Date.now() },
  }).select('+verificationToken +verificationTokenExpire');

  if (!user) throw new ApiError(400, 'Invalid or expired verification token');

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Email verified successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });

  if (user) {
    const rawToken = generateRandomToken();
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save();
    await sendResetPasswordEmail(user, rawToken);
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(400, 'Token and new password are required');

  const hashed = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, avatar, theme } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (avatar) user.avatar = avatar;
  if (theme) user.theme = theme;
  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

module.exports = {
  register,
  login,
  googleLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
};
