const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt");
const cors = require("cors");


router.post("/", async (req, res) => {
  try {
    // Validate the request body
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    // Check if the user already exists
    const user = await User.findOne({ email: req.body.email });
    if (user)
      return res
        .status(409)
        .send({ message: "User with given email already exists!" });

    // Hash the password
    console.log("hashing the password")
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new user
    const newUser = new User({ ...req.body, password: hashPassword })
    await newUser.save();
    console.log("user saved to database", newUser)

    res.status(201).send({ message: "User created successfully" });
  } catch (error) {
    console.error("Error:", error); // Log the error for debugging
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;

