// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());



// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URI)
.then(() => console.log('MongoDB (Atlas) connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Hello World');
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/user', require('./routes/users'));
app.use('/transactions', require('./routes/transactions'));

// Server start
const PORT =5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


