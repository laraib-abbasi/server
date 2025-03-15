require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const connection= require('./db');
const userRoutes=require('./routes/users');
const authRoutes=require('./routes/auth');


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