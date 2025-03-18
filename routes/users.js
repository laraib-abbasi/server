const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { sendOTPEmail } = require("../utils/mailer");
const otpGenerator = require("otp-generator");


router.post("/", async (req, res) => {
  try {
    // Validate the request body
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    // Check if the user already exists
    const userEmail = await User.findOne({ email: req.body.email });
    if (userEmail)
      return res
        .status(409)
        .send({ message: "User with given email already exists!" });

        const userName = await User.findOne({ username: req.body.username });
        if (userName)
          return res
            .status(409)
            .send({ message: "User with given username already exists!" });
    // Hash the password
    console.log("hashing the password")
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
  
    //OTP for email verification 
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Create a new user
    const newUser = new User({ ...req.body, password: hashPassword, otp, otpExpires })
    await newUser.save();

    await sendOTPEmail(req.body.email, otp); // Send OTP email

    console.log("user saved to database", newUser)

    res.status(201).send({ message: "OTP sent to your email for verification" });
    // res.status(201).send({ message: "User created successfully" });
  } catch (error) {
    console.error("Error:", error); // Log the error for debugging
    res.status(500).send({ message: "Internal Server Error" });
  }
});

//another route for OTP Verification
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).send({ message: "Invalid or expired OTP" });

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).send({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;

