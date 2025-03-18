const nodemailer = require("nodemailer");
const HttpsProxyAgent = require("https-proxy-agent");


const transporter = nodemailer.createTransport({
  host:"smtp.ethereal.com",
  port:2525,
  secure:false, //use SSL
  auth: {
    user: 'ed.schuppe@ethereal.email', // Your email address
    pass: '9FMrGFj8tgxTC9wkdM', // Your email password or app-specific password
  },
  logger: true, // Log connection details
  debug: true, // Include SMTP traffic in logs
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 10000, // 10 seconds
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: "ed.schuppe@ethereal.email",
    to: email,
    subject: "Email Verification OTP",
    text: `Your OTP for email verification is: ${otp}`,
  };

  await transporter.sendMail(mailOptions);
};

const sendTestEmail = async () => {
    try {
      const mailOptions = {
        from: "ed.schuppe@ethereal.email",
        to: "recipient@example.com",
        subject: "Test Email",
        text: "This is a test email.",
      };
  
      await transporter.sendMail(mailOptions);
      console.log("Test email sent successfully");
    } catch (error) {
      console.error("Error sending test email:", error);
    }
  };
  
  sendTestEmail();
  
module.exports = { sendOTPEmail };
