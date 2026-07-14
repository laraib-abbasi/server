require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const connection= require('./db');
const userRoutes=require('./routes/users');
const authRoutes=require('./routes/auth');
const bookRoutes=require('./routes/books');
const exchangeRoutes=require('./routes/exchanges')

const https = require('https');
const User = require('./models/user'); // Import the User model
https.get('https://www.google.com', (res) => {
  console.log(`Status Code: ${res.statusCode}`);
}).on('error', (err) => {
  console.error('Error:', err);
});
//database connection
// const dbConnection = connection(); // This should return the connection promise

// connection();
// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://lithub-frontend.vercel.app']
}));
// Global error handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err); // Log the full error
    res.status(500).send({ message: 'Internal Server Error' });
  });
//routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books',bookRoutes)
app.use('/api/exchanges',exchangeRoutes)


const port = process.env.PORT || 8080;

// Database connection and server startup
async function startServer() {
  try {
    // Make sure your db.js exports a promise or connection object
    await connection(); 
    
    // Schedule cleanup of unverified users
    setInterval(async () => {
      try {
        await User.deleteMany({
          isVerified: false,
          otpExpires: { $lt: new Date() }
        });
      } catch (err) {
        console.error('Error cleaning up unverified users:', err);
      }
    }, 60 * 60 * 1000); // Every hour
    

    console.log(`Server started at: ${new Date().toISOString()}`);
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

startServer();


// Start server only after database connection is established
// dbConnection.then(()=>{
//   app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });
// setInterval(async () => {
//   await User.deleteMany({
//     isVerified: false,
//     otpExpires: { $lt: new Date() } // OTP expired
//   });
// }, 60 * 60 * 1000);
// })
