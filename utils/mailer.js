// Function to send OTP email
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// const sendOTPEmail = async (email, otp) => {
//   try {
//     // Create the email object
//     const msg = {
//       to: email, // Recipient's email address
//       from: 'iam.skipperod@gmail.com', // Verified sender email in SendGrid
//       subject: 'Your OTP for Registration', // Email subject
//       text: `Your OTP is: ${otp}`, // Plain text body
//       html: `<strong>Your OTP is: ${otp}</strong>`, // HTML body
//     };
//     // Send the email
//     await sgMail.send(msg);
//     console.log(`OTP sent to ${email}`);
//   } catch (error) {
//     console.error('Error sending OTP email:', error);
//     throw error; // Propagate the error to the caller
//   }
// };
// // Export the sendOTPEmail function
// module.exports = { sendOTPEmail };


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