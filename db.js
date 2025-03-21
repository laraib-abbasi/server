const mongoose = require("mongoose");

module.exports = () => {
  const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  try {
    mongoose.connect(process.env.DB);
    console.log("Connected to database", connectionParams);
  } catch (error) {
    console.log(error);
    console.log("could not connect to database");
  }
};
