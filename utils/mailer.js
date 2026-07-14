const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendOTPEmail(userEmail,otp) {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000, // 10 seconds
    });

    let info = await transporter.sendMail({
      from: '"LitHub" <' + process.env.EMAIL_USER + '>',
      to: userEmail,
      subject: 'Your OTP for Registration',
      text: `Your OTP is: ${otp}`,
      html: `<strong>Your OTP is: ${otp}</strong>`,
    });

    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (err) {
    console.error('Email error:', err);
    throw err;
  }
}

module.exports = sendOTPEmail;