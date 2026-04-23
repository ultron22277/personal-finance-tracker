const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

/**
 * Send password reset email with ONE-TIME LINK
 * The link contains the plain token — never the hash
 * The link expires in 1 hour and is single-use
 */
exports.sendPasswordResetEmail = async (to, name, resetLink) => {
  try {
    await transporter.sendMail({
      from: `"Finance Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Password Reset Request — Personal Finance Tracker',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#4F46E5">Reset Your Password</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:0.875rem;">
            This link expires in <strong>1 hour</strong> and can only be used once.<br/>
            If you did not request this, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
          <p style="color:#9ca3af;font-size:0.75rem;">Personal Finance Tracker — your data stays private.</p>
        </div>
      `,
    });
    logger.info(`Password reset email sent to ${to}`);
  } catch (err) {
    logger.error('Email error:', err.message);
    throw err;
  }
};

exports.sendBudgetAlertEmail = async (to, name, category, percent) => {
  try {
    await transporter.sendMail({
      from: `"Finance Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Budget Alert: ${category} at ${percent}%`,
      html: `<p>Hi ${name},</p><p>Your <strong>${category}</strong> budget has reached <strong>${percent}%</strong>.</p>`,
    });
  } catch (err) { logger.error('Budget alert email error:', err.message); }
};
