const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const sendOTPEmail = require("../utils/mailer");
const otpGenerator = require("otp-generator");
const { auth, admin } = require("../middleware/auth");
const mongoose = require('mongoose');


// GET all books
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password -otp -otpExpires")
      .sort({ createdAt: -1 });
    res.status(200).send(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });
    // Check if a VERIFIED user already exists with this email
    const existingEmail = await User.findOne({
      email: req.body.email,
      isVerified: true,
    });
    if (existingEmail) {
      return res.status(409).send({ message: "Email already in use." });
    }
    // Check if username is already taken (regardless of verification status)
    const existingUsername = await User.findOne({
      username: req.body.username,
      isVerified: true,
    });
    if (existingUsername) {
      return res.status(409).send({ message: "Username already taken." });
    }
    // If unverified user exists, delete it (allow re-signup)
    await User.deleteMany({
      email: req.body.email,
      isVerified: false,
    });
    // Proceed with signup (hash password, generate OTP, etc.)
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
  
    //OTP for email verification 
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Determine if this is an admin-created user (skip OTP)
    const isAdminCreation = req.body.isVerified === true;

    const otp = otpGenerator.generate(4, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); //expires in 5 minutes
    const newUser = new User({
      ...req.body,
      password: hashPassword,
      isVerified: isAdminCreation, // Set to true if admin is creating
      ...(!isAdminCreation && {
        otp,
      }),
      otpExpires,
    });

    await newUser.save();

    //only send otp if not created by admin
    if (!isAdminCreation) {
      await sendOTPEmail(req.body.email, otp);
      res.status(201).send({ message: "OTP sent to email." });
    } else {
      res
        .status(201)
        .send({
          message: "User created Successfully.",
          user: newUser.toObject(),
        });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

console.log("Test");
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
      return res
        .status(400)
        .send({ message: "Invalid/expired OTP or already verified." });
    }
    // Mark as verified and save
    user.isVerified = true;
    user.otp = undefined; // Clear OTP
    user.otpExpires = undefined; // Clear expiry
    await user.save();
    res.status(200).send({ message: "Email verified! Account activated." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



// Get Single User Route (Admin Only)
router.get("/:id", auth,  async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid user ID" });
    }

    const user = await User.findById(id).select("-password -confirmPassword -otp -otpExpires");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Edit/Update User Route (Admin Only)
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      role, 
      isBlocked, 
      username, 
      email,
      firstName,
      lastName,
      address,
      mobileNo,
      profilePicture,
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid user ID" });
    }

    // Prevent self-modification of admin role
    if (id === req.user._id) {
      return res.status(403).send({ message: "Cannot modify own admin account" });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Validate input
    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).send({ message: "Invalid role" });
    }
    if (isBlocked !== undefined && typeof isBlocked !== "boolean") {
      return res.status(400).send({ message: "isBlocked must be a boolean" });
    }
    if (isVerified !== undefined && typeof isVerified !== "boolean") {
      return res.status(400).send({ message: "isVerified must be a boolean" });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        email: email,
        _id: { $ne: id }, // Exclude current user
        isVerified: true,
      });
      if (existingEmail) {
        return res.status(409).send({ message: "Email already in use." });
      }
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({
        username: username,
        _id: { $ne: id }, // Exclude current user
        isVerified: true,
      });
      if (existingUsername) {
        return res.status(409).send({ message: "Username already taken." });
      }
    }

    // Update all fields that are provided
    if (role) user.role = role;
    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    if (username) user.username = username;
    if (profilePicture) user.profilePicture = profilePicture;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (address !== undefined) user.address = address; // Allows empty string
    if (mobileNo !== undefined) user.mobileNo = mobileNo; // Allows empty string
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();
    
    const updatedUser = await User.findById(id).select("-password -otp -otpExpires");
    res.status(200).send({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


// Delete User Route (Admin Only)
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid user ID" });
    }

    // Prevent self-deletion
    if (id === req.user._id) {
      return res
        .status(403)
        .send({ message: "Cannot delete own admin account" });
    }

    // Find and delete user
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ 
      message: "User deleted successfully",
      deletedUser: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Additional Route: Update User Profile (For authenticated users to update their own profile)
router.put("/profile/me", auth, async (req, res) => {
  try {
    const { 
      username, 
      email, 
      firstName,
      lastName,
      address,
      mobileNo,
      currentPassword, 
      newPassword,
      profilePicture,
    } = req.body;
    
    const userId = req.user._id;
    console.log('Authenticated user ID:', req.user._id);

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        email: email,
        _id: { $ne: userId },
        isVerified: true,
      });
      if (existingEmail) {
        return res.status(409).send({ message: "Email already in use." });
      }
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({
        username: username,
        _id: { $ne: userId },
        isVerified: true,
      });
      if (existingUsername) {
        return res.status(409).send({ message: "Username already taken." });
      }
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).send({ message: "Current password is required" });
      }
      
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).send({ message: "Current password is incorrect" });
      }
      
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Update all profile fields
    if (username) user.username = username;
    if (profilePicture) user.profilePicture = profilePicture;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (address !== undefined) user.address = address;
    if (mobileNo !== undefined) user.mobileNo = mobileNo;

    await user.save();
    
    const updatedUser = await User.findById(userId).select("-password -otp -otpExpires");
    res.status(200).send({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


module.exports = router;
