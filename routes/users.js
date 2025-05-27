const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const sendOTPEmail  = require("../utils/mailer");
const otpGenerator = require("otp-generator");

router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });
    // Check if a VERIFIED user already exists with this email
    // Check if email is already in use (for verified users)
    const existingEmail = await User.findOne({
      email: req.body.email,
      isVerified: true
    });
    if (existingEmail) {
      return res.status(409).send({ message: "Email already in use." });
    }
    // Check if username is already taken (regardless of verification status)
    const existingUsername = await User.findOne({
      username: req.body.username ,
      isVerified: true
    });
    if (existingUsername) {
      return res.status(409).send({ message: "Username already taken." });
    }
    // If unverified user exists, delete it (allow re-signup)
    await User.deleteMany({
      email: req.body.email,
      isVerified: false
    });
    // Proceed with signup (hash password, generate OTP, etc.)
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    const otp = otpGenerator.generate(6, { digits: true });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const newUser = new User({
      ...req.body,
      password: hashPassword,
      otp,
      otpExpires,
      isVerified: false,
    });
    await newUser.save();
    await sendOTPEmail(req.body.email, otp);
    res.status(201).send({ message: "OTP sent to email." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});
console.log('Test')
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    // Find unverified user (must match email + OTP + not expired)
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() }, // OTP not expired
      isVerified: false, // Ensure user is unverified
    });
    if (!user) {
      return res.status(400).send({ message: "Invalid/expired OTP or already verified." });
    }
    // Mark as verified and save
    user.isVerified = true;
    user.otp = undefined;       // Clear OTP
    user.otpExpires = undefined; // Clear expiry
    await user.save();
    res.status(200).send({ message: "Email verified! Account activated." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});
module.exports = router;
