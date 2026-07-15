const nodemailer = require('nodemailer');

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendMail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[email] SMTP not configured — skipping send to ${to}: "${subject}"`);
    return { skipped: true };
  }
  const transporter = getTransporter();
  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'FocusOS <no-reply@focusos.app>',
    to,
    subject,
    html,
  });
};

const sendVerificationEmail = async (user, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  return sendMail({
    to: user.email,
    subject: 'Verify your FocusOS account',
    html: `<p>Hi ${user.name},</p><p>Welcome to FocusOS. Verify your email to activate your account:</p><p><a href="${link}">${link}</a></p>`,
  });
};

const sendResetPasswordEmail = async (user, token) => {
  const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  return sendMail({
    to: user.email,
    subject: 'Reset your FocusOS password',
    html: `<p>Hi ${user.name},</p><p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${link}">${link}</a></p>`,
  });
};

module.exports = { sendMail, sendVerificationEmail, sendResetPasswordEmail };
