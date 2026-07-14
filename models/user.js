const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true},
  password: { type: String, required: true },
  confirmPassword:{type:String},
  username: { type: String, required: true },
  mobileNo: { type: String, required: false}, // Changed to String
  address: { type: String, required: false },
  role: { type: String,required:true, enum: ['user', 'admin'], default: "user" }, // Default role
  profilePicture: { type: String }, // Store the path or URL
  isVerified: {
    type: Boolean,
    default: false, // Defaults to false (unverified)
  },
  otp: { type: String }, // Store OTP
  otpExpires: { type: Date }, // Store OTP expiration time
  isBlocked: { type: Boolean, default: false }, // Blocked status
  createdAt: { type: Date, default: Date.now }, // Automatically set creation date
  updatedAt: { type: Date, default: Date.now }, // Automatically set update date
  lastLogin: { type: Date, default: Date.now }, // Track last login time
});
// Add a partial index to enforce uniqueness ONLY for verified users
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { isVerified: true }
  }
);
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, role: this.role },
    process.env.JWTPRIVATEKEY, // Ensure this is defined in your .env file
    { expiresIn: "7d" }
  );
  return token;
};
const User = mongoose.model("User", userSchema);
const validate = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: passwordComplexity().required().label("Password"),
    confirmPassword: Joi.string().label("Confirm Password"),
    username: Joi.string().required().label("Username"),
    mobileNo: Joi.string().label("Mobile Number"), // Changed to String
    address: Joi.string().label("Address"),
    role: Joi.string().required().label("Role"),
    profilePicture: Joi.string().uri(),
    isVerified:Joi.boolean()
  });
  return schema.validate(data);
};
module.exports = { User, validate };