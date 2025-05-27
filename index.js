require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const connection= require('./db');
const userRoutes=require('./routes/users');
const authRoutes=require('./routes/auth');
const https = require('https');
const User = require('./models/user'); // Import the User model
https.get('https://www.google.com', (res) => {
  console.log(`Status Code: ${res.statusCode}`);
}).on('error', (err) => {
  console.error('Error:', err);
});
//database connection
connection();
// Middleware
app.use(express.json());
app.use(cors());
// Global error handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err); // Log the full error
    res.status(500).send({ message: 'Internal Server Error' });
  });
//routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
// Run every hour
setInterval(async () => {
  await User.deleteMany({
    isVerified: false,
    otpExpires: { $lt: new Date() } // OTP expired
  });
}, 60 * 60 * 1000);

// require('dotenv').config();
// const express = require('express');
// const app = express();
// const cors = require('cors');
// const connection= require('./db');
// const userRoutes=require('./routes/users');
// const authRoutes=require('./routes/auth');
// const https = require('https');


// https.get('https://www.google.com', (res) => {
//   console.log(`Status Code: ${res.statusCode}`);
// }).on('error', (err) => {
//   console.error('Error:', err);
// });

// //database connection
// connection();

// // Middleware
// app.use(express.json());
// app.use(cors());

// // Global error handler
// app.use((err, req, res, next) => {
//     console.error("Global Error Handler:", err); // Log the full error
//     res.status(500).send({ message: 'Internal Server Error' });
//   });

// //routes
// app.use('/api/users', userRoutes);
// app.use('/api/auth', authRoutes);

// const port = process.env.PORT || 8080;
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });