const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  mobileNo: { type: String, required: true }, // Changed to String
  address: { type: String, required: true },
  role: { type: String, required: true, default: "user" }, // Default role
  picture: { type: String, required: false }, // Optional field
});

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
    firstName: Joi.string().min(2).max(50).required().label("First Name"),
    lastName: Joi.string().min(2).max(50).required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: passwordComplexity().required().label("Password"),
    username: Joi.string().required().label("Username"),
    mobileNo: Joi.string().required().label("Mobile Number"), // Changed to String
    address: Joi.string().required().label("Address"),
  });
  return schema.validate(data);
};

module.exports = { User, validate };

