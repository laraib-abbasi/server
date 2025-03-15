const router = require("express").Router();
const { User } = require("../models/user");
const Joi = require("joi");
const bcrypt = require("bcrypt");


router.post("/", async (req, res) => {
  console.log("hello");
  try {
    console.log("Request Body:", req.body); // Debugging

    const { error } = validate(req.body);
    if (error) {
      console.log("Validation Error:", error.details[0].message); // Debugging: Log validation errors

      return res.status(400).send({ message: error.details[0].message });
    }

    //check if the user exists
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      console.log("User Not Found"); // Debugging: Log if user is not found

      return res.status(400).send({ message: "Invalid username or password" });
    }
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword)
      return res.status(401).send({ message: "Invalid username or password" });

    const token = user.generateAuthToken();
    console.log("Token Generated:", token); // Debugging

    res.status(200).send({ data: token, message: "Login successful" });
  } catch (error) {

    console.error("Login Error:", error); // Debugging
    res.status(500).send({ message: "Internal server error" });
  }
});

const validate = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().label("Username"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data);
};

module.exports = router;
